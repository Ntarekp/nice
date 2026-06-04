const { Inspection, MaintenanceLog } = require("../models");
const axios = require("axios");
const { Op } = require("sequelize");

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL;
const EQUIPMENT_URL = process.env.EQUIPMENT_SERVICE_URL;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

exports.schedule = async (req, res) => {
  const { extinguisherId, scheduledDate, type, assignedInspector, notes } = req.body;

  try {
    await axios.get(`${EQUIPMENT_URL}/api/extinguishers/${extinguisherId}`, {
      headers: { Authorization: req.headers.authorization },
    });
  } catch {
    return res.status(404).json({ error: "Extinguisher not found" });
  }

  const inspection = await Inspection.create({
    extinguisherId,
    scheduledDate,
    type: type || "routine",
    assignedInspector,
    notes,
    scheduledBy: req.user.sub,
  });

  if (assignedInspector) {
    let inspectorEmail = req.body.inspectorEmail;
    try {
      if (!inspectorEmail) {
        const u = await axios.get(`${USER_SERVICE_URL}/api/users/${assignedInspector}`, {
          headers: { Authorization: req.headers.authorization },
        });
        inspectorEmail = u.data.email;
      }
      if (inspectorEmail) {
        await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, {
          type: "inspection_scheduled",
          payload: {
            email: inspectorEmail,
            scheduledDate,
            extinguisherId,
            inspectionId: inspection.id,
          },
        });
        await inspection.update({ notifiedAt: new Date() });
      }
    } catch (e) {
      console.error("[inspection-service] Notification failed:", e.message);
    }
  }

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
  if (req.user.role === "inspector") where.assignedInspector = req.user.sub;
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
  res.json(inspection);
};

exports.update = async (req, res) => {
  const inspection = await Inspection.findByPk(req.params.id);
  if (!inspection) return res.status(404).json({ error: "Inspection not found" });

  if (
    req.user.role === "inspector" &&
    inspection.assignedInspector &&
    inspection.assignedInspector !== req.user.sub
  ) {
    return res.status(403).json({ error: "Not your assigned inspection" });
  }

  const { status, result, findings, notes, completedDate, nextInspectionDate } = req.body;
  await inspection.update({
    status,
    result,
    findings,
    notes,
    completedDate:
      completedDate || (status === "completed" ? new Date() : inspection.completedDate),
    nextInspectionDate,
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
  }

  res.json(inspection);
};
