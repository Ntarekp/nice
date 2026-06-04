const { Extinguisher } = require("../models");
const { Op, fn, col } = require("sequelize");

exports.create = async (req, res) => {
  const {
    serialNumber,
    location,
    building,
    floor,
    room,
    type,
    size,
    manufacturer,
    model,
    installationDate,
    expiryDate,
    notes,
    pressure,
  } = req.body;

  const exists = await Extinguisher.findOne({ where: { serialNumber } });
  if (exists) return res.status(409).json({ error: "Serial number already registered" });

  const nextInspectionDate = new Date(installationDate);
  nextInspectionDate.setFullYear(nextInspectionDate.getFullYear() + 1);

  const ext = await Extinguisher.create({
    serialNumber,
    location,
    building,
    floor,
    room,
    type,
    size,
    manufacturer,
    model,
    installationDate,
    expiryDate,
    nextInspectionDate: nextInspectionDate.toISOString().split("T")[0],
    notes,
    pressure,
    createdBy: req.user.sub,
  });

  res.status(201).json(ext);
};

exports.list = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;
  const { status, type, location, search, expiringSoon } = req.query;

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (location) where.location = { [Op.iLike]: `%${location}%` };

  if (expiringSoon === "true") {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    where.expiryDate = { [Op.lte]: thirtyDays.toISOString().split("T")[0] };
  }

  if (search) {
    where[Op.or] = [
      { serialNumber: { [Op.iLike]: `%${search}%` } },
      { location: { [Op.iLike]: `%${search}%` } },
      { building: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const today = new Date().toISOString().split("T")[0];
  await Extinguisher.update(
    { status: "expired" },
    { where: { expiryDate: { [Op.lt]: today }, status: "active" } }
  );

  const { count, rows } = await Extinguisher.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  res.json({
    data: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  });
};

exports.getById = async (req, res) => {
  const ext = await Extinguisher.findByPk(req.params.id);
  if (!ext) return res.status(404).json({ error: "Extinguisher not found" });
  res.json(ext);
};

exports.update = async (req, res) => {
  const ext = await Extinguisher.findByPk(req.params.id);
  if (!ext) return res.status(404).json({ error: "Extinguisher not found" });

  const allowed = [
    "location",
    "building",
    "floor",
    "room",
    "status",
    "pressure",
    "notes",
    "lastInspectionDate",
    "nextInspectionDate",
    "expiryDate",
    "type",
    "size",
  ];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  await ext.update(updates);
  res.json(ext);
};

exports.remove = async (req, res) => {
  const ext = await Extinguisher.findByPk(req.params.id);
  if (!ext) return res.status(404).json({ error: "Extinguisher not found" });

  if (req.query.hard === "true" && req.user.role === "admin") {
    await ext.destroy();
    return res.json({ message: "Extinguisher permanently deleted" });
  }

  await ext.update({ status: "decommissioned" });
  res.json({ message: "Extinguisher decommissioned" });
};

exports.summary = async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const [total, active, expired, maintenance, expiringSoon, byType] = await Promise.all([
    Extinguisher.count(),
    Extinguisher.count({ where: { status: "active" } }),
    Extinguisher.count({ where: { status: "expired" } }),
    Extinguisher.count({ where: { status: "maintenance" } }),
    Extinguisher.count({
      where: {
        expiryDate: { [Op.between]: [today, thirtyDays.toISOString().split("T")[0]] },
        status: "active",
      },
    }),
    Extinguisher.findAll({
      attributes: ["type", [fn("COUNT", col("id")), "count"]],
      group: ["type"],
      raw: true,
    }),
  ]);

  res.json({ total, active, expired, maintenance, expiringSoon, byType });
};
