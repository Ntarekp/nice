const { MaintenanceLog } = require("../models");
const axios = require("axios");
const { Op } = require("sequelize");

const EQUIPMENT_URL = process.env.EQUIPMENT_SERVICE_URL;

exports.logMaintenance = async (req, res) => {
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
    inspectionId,
    performedBy: req.user.sub,
    actionDate,
    actionsTaken,
    conditionsNoted,
    partsReplaced: partsReplaced || [],
    cost,
    nextServiceDate,
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
