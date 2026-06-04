const { MaintenanceLog } = require("../models");
const axios = require("axios");
const { Op } = require("sequelize");

const EQUIPMENT_URL = process.env.EQUIPMENT_SERVICE_URL;

exports.logMaintenance = async (req, res) => {
  if (req.user.role !== "inspector") {
    return res.status(403).json({ error: "Only inspectors can log maintenance" });
  }

  const {
    extinguisherId,
    inspectionId,
    actionDate,
    actionsTaken,
    conditionsNoted,
    partsReplaced,
    cost,
    nextServiceDate,
    status,
  } = req.body;

  const log = await MaintenanceLog.create({
    extinguisherId,
    inspectionId: inspectionId || null,
    performedBy: req.user.sub,
    actionDate,
    actionsTaken,
    conditionsNoted: conditionsNoted?.trim() || null,
    partsReplaced: partsReplaced || [],
    cost: cost === "" || cost == null ? null : Number(cost),
    nextServiceDate: nextServiceDate || null,
    status: status || "completed",
  });

  if (status === "decommissioned") {
    try {
      await axios.patch(
        `${EQUIPMENT_URL}/api/extinguishers/${extinguisherId}`,
        { status: "decommissioned" },
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (e) {
      console.error("[inspection-service] Equipment status update failed:", e.message);
    }
  }

  res.status(201).json(log);
};

exports.listMaintenance = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;
  const { extinguisherId, from, to } = req.query;

  if (req.user.role === "user") {
    if (!extinguisherId) {
      return res.status(400).json({ error: "extinguisherId is required" });
    }
    try {
      await axios.get(`${EQUIPMENT_URL}/api/extinguishers/${extinguisherId}`, {
        headers: { Authorization: req.headers.authorization },
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) return res.status(403).json({ error: "Access denied" });
      return res.status(404).json({ error: "Extinguisher not found" });
    }
  }

  const where = {};
  if (extinguisherId) where.extinguisherId = extinguisherId;
  if (from || to) {
    where.actionDate = {};
    if (from) where.actionDate[Op.gte] = from;
    if (to) where.actionDate[Op.lte] = to;
  }

  const { count, rows } = await MaintenanceLog.findAndCountAll({
    where,
    limit,
    offset,
    order: [["actionDate", "DESC"]],
  });

  res.json({
    data: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  });
};
