const { Inspection, MaintenanceLog } = require("../models");
const axios = require("axios");
const { Op } = require("sequelize");

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL;
const EQUIPMENT_URL = process.env.EQUIPMENT_SERVICE_URL;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const SERVICE_KEY = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET;

const fetchExtinguisherMeta = async (extinguisherId, authHeader) => {
  try {
    const { data } = await axios.get(`${EQUIPMENT_URL}/api/extinguishers/${extinguisherId}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      timeout: 10000,
    });
    return {
      serialNumber: data.serialNumber,
      location: data.location,
      building: data.building,
    };
  } catch {
    return { serialNumber: null, location: null, building: null };
  }
};

const fetchAdminEmails = async () => {
  const emails = new Set();
  if (process.env.ADMIN_SMTP) {
    emails.add(String(process.env.ADMIN_SMTP).trim().toLowerCase());
  }
  if (!USER_SERVICE_URL || !SERVICE_KEY) return [...emails];

  try {
    const { data } = await axios.get(`${USER_SERVICE_URL}/api/internal/admin-emails`, {
      headers: { "X-Service-Key": SERVICE_KEY },
      timeout: 10000,
    });
    for (const admin of data.data || []) {
      if (admin.email) emails.add(admin.email.toLowerCase());
    }
  } catch (e) {
    console.error("[inspection-service] Could not load admin emails:", e.message);
  }
  return [...emails];
};

const sendNotification = async (type, payload) => {
  if (!NOTIFICATION_URL) return false;
  try {
    await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, { type, payload }, { timeout: 20000 });
    return true;
  } catch (e) {
    console.error(`[inspection-service] Notification ${type} failed:`, e.message);
    return false;
  }
};

const notifyInspector = async (inspection, inspectorEmail, authHeader, equipmentMeta) => {
  if (!inspectorEmail) return;
  const sent = await sendNotification("inspection_scheduled", {
    email: inspectorEmail,
    scheduledDate: inspection.scheduledDate,
    extinguisherId: inspection.extinguisherId,
    inspectionId: inspection.id,
    serialNumber: equipmentMeta?.serialNumber,
    location: equipmentMeta?.location,
  });
  if (sent) await inspection.update({ notifiedAt: new Date() });
};

const notifyAdminsOnCompletion = async (inspection, inspector, equipmentMeta) => {
  const adminEmails = await fetchAdminEmails();
  if (!adminEmails.length) {
    console.warn("[inspection-service] No admin emails configured for completion notice");
    return;
  }

  const inspectorName = inspector
    ? `${inspector.firstName || ""} ${inspector.lastName || ""}`.trim() || inspector.email
    : "Inspector";

  const payloadBase = {
    inspectionId: inspection.id,
    serialNumber: equipmentMeta?.serialNumber || inspection.extinguisherId,
    location: equipmentMeta?.location,
    scheduledDate: inspection.scheduledDate,
    completedDate: inspection.completedDate || new Date(),
    result: inspection.result,
    findings: inspection.findings,
    inspectorName,
    inspectorEmail: inspector?.email,
  };

  await Promise.all(
    adminEmails.map((email) =>
      sendNotification("inspection_completed", { email, ...payloadBase })
    )
  );
};

const assertInspectorAccess = (inspection, user) => {
  if (user.role !== "inspector") return null;
  if (!inspection.assignedInspector || inspection.assignedInspector !== user.sub) {
    return "This inspection is not assigned to you";
  }
  return null;
};

/** Facility user requests an inspection (no inspector yet — admin assigns later). */
exports.schedule = async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ error: "Only facility users can request inspections" });
  }

  const { extinguisherId, scheduledDate, type, notes } = req.body;

  try {
    await axios.get(`${EQUIPMENT_URL}/api/extinguishers/${extinguisherId}`, {
      headers: { Authorization: req.headers.authorization },
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 403) return res.status(403).json({ error: "Access denied to this extinguisher" });
    return res.status(404).json({ error: "Extinguisher not found" });
  }

  const inspection = await Inspection.create({
    extinguisherId,
    scheduledDate,
    type: type || "routine",
    assignedInspector: null,
    notes,
    scheduledBy: req.user.sub,
    status: "scheduled",
  });

  res.status(201).json(inspection);
};

exports.list = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;
  const { status, type, extinguisherId, from, to } = req.query;

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (extinguisherId) where.extinguisherId = extinguisherId;
  if (req.user.role === "user") where.scheduledBy = req.user.sub;
  if (req.user.role === "inspector") where.assignedInspector = req.user.sub;
  if (req.user.role === "admin" && req.query.ownerId) where.scheduledBy = req.query.ownerId;
  if (req.query.unassigned === "true") {
    where.assignedInspector = null;
    where.status = "scheduled";
  }
  if (from || to) {
    where.scheduledDate = {};
    if (from) where.scheduledDate[Op.gte] = new Date(from);
    if (to) where.scheduledDate[Op.lte] = new Date(to);
  }

  const { count, rows } = await Inspection.findAndCountAll({
    where,
    limit,
    offset,
    order: [["scheduledDate", "ASC"]],
  });

  res.json({
    data: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  });
};

exports.getById = async (req, res) => {
  const inspection = await Inspection.findByPk(req.params.id, {
    include: [{ model: MaintenanceLog, as: "maintenanceLogs" }],
  });
  if (!inspection) return res.status(404).json({ error: "Inspection not found" });

  const inspectorErr = assertInspectorAccess(inspection, req.user);
  if (inspectorErr) return res.status(403).json({ error: inspectorErr });
  if (req.user.role === "user" && inspection.scheduledBy !== req.user.sub) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json(inspection);
};

/** Admin assigns an inspector to a scheduled inspection. */
exports.assignInspector = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only admins can assign inspectors" });
  }

  const { assignedInspector } = req.body;
  const inspection = await Inspection.findByPk(req.params.id);
  if (!inspection) return res.status(404).json({ error: "Inspection not found" });

  if (!["scheduled", "in_progress"].includes(inspection.status)) {
    return res.status(400).json({
      error: "Cannot assign inspector to a completed or cancelled inspection",
    });
  }

  let inspectorUser;
  try {
    const { data } = await axios.get(`${USER_SERVICE_URL}/api/users/${assignedInspector}`, {
      headers: { Authorization: req.headers.authorization },
    });
    inspectorUser = data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) return res.status(400).json({ error: "Inspector not found" });
    return res.status(502).json({ error: "Could not verify inspector" });
  }

  if (inspectorUser.role !== "inspector" || !inspectorUser.isActive) {
    return res.status(400).json({ error: "Selected user must be an active inspector" });
  }

  await inspection.update({ assignedInspector });
  const equipmentMeta = await fetchExtinguisherMeta(
    inspection.extinguisherId,
    req.headers.authorization
  );
  await notifyInspector(inspection, inspectorUser.email, req.headers.authorization, equipmentMeta);

  res.json(inspection);
};

/** Inspector records progress and completion. */
exports.update = async (req, res) => {
  if (req.user.role !== "inspector") {
    return res.status(403).json({ error: "Only inspectors can update inspections" });
  }

  const inspection = await Inspection.findByPk(req.params.id);
  if (!inspection) return res.status(404).json({ error: "Inspection not found" });

  const inspectorErr = assertInspectorAccess(inspection, req.user);
  if (inspectorErr) return res.status(403).json({ error: inspectorErr });

  const { status, result, findings, notes, completedDate, nextInspectionDate } = req.body;

  if (status === "completed" && !result) {
    return res.status(400).json({ error: "Result is required when marking completed" });
  }

  await inspection.update({
    status: status || inspection.status,
    result: result ?? inspection.result,
    findings: findings ?? inspection.findings,
    notes: notes ?? inspection.notes,
    completedDate:
      completedDate || (status === "completed" ? new Date() : inspection.completedDate),
    nextInspectionDate: nextInspectionDate ?? inspection.nextInspectionDate,
  });

  if (status === "completed") {
    try {
      await axios.patch(
        `${EQUIPMENT_URL}/api/extinguishers/${inspection.extinguisherId}`,
        {
          lastInspectionDate: new Date().toISOString().split("T")[0],
          nextInspectionDate,
        },
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (e) {
      console.error("[inspection-service] Equipment update failed:", e.message);
    }

    const equipmentMeta = await fetchExtinguisherMeta(
      inspection.extinguisherId,
      req.headers.authorization
    );
    let inspectorProfile = { email: req.user.email };
    try {
      const { data } = await axios.get(
        `${USER_SERVICE_URL}/api/internal/users/${req.user.sub}`,
        { headers: { "X-Service-Key": SERVICE_KEY }, timeout: 10000 }
      );
      inspectorProfile = data;
    } catch {
      /* email from JWT is enough for notification */
    }
    await notifyAdminsOnCompletion(inspection, inspectorProfile, equipmentMeta);
  }

  res.json(inspection);
};
