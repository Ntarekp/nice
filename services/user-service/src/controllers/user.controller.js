const { User, AuditLog } = require("../models");
const { hashPassword, generateTempPassword } = require("../utils/password");
const axios = require("axios");
const { Op } = require("sequelize");

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL;

const sanitizeUser = (user) => {
  const { password, ...safe } = user.toJSON();
  return safe;
};

exports.createUser = async (req, res) => {
  const { firstName, lastName, email, role, phone, department } = req.body;

  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const tempPassword = generateTempPassword();
  const hashed = await hashPassword(tempPassword);

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: hashed,
    role: role || "user",
    phone,
    department,
    mustChangePassword: true,
    isEmailVerified: true,
  });

  try {
    await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, {
      type: "welcome",
      payload: {
        email: user.email,
        name: user.firstName,
        tempPassword,
        role: user.role,
      },
    });
  } catch (e) {
    console.error("[user-service] Welcome email failed:", e.message);
  }

  await AuditLog.create({
    userId: req.user.sub,
    action: "USER_CREATED",
    resource: "users",
    resourceId: user.id,
    newValues: { email: user.email, role: user.role },
  });

  res.status(201).json({
    message: "User created. Temporary password sent to email.",
    user: sanitizeUser(user),
  });
};

exports.listUsers = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;
  const { role, isActive, search } = req.query;

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === "true";
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ["password"] },
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  res.json({
    data: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  });
};

exports.getUser = async (req, res) => {
  if (req.params.id !== "me" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const where = req.params.id === "me" ? { id: req.user.sub } : { id: req.params.id };
  const user = await User.findOne({ where, attributes: { exclude: ["password"] } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
};

exports.updateUser = async (req, res) => {
  const targetId = req.params.id === "me" ? req.user.sub : req.params.id;
  if (targetId !== req.user.sub && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const user = await User.findByPk(targetId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const allowed = ["firstName", "lastName", "phone", "department", "profileImage"];
  if (req.user.role === "admin") allowed.push("role", "isActive");

  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const old = user.toJSON();
  await user.update(updates);

  await AuditLog.create({
    userId: req.user.sub,
    action: "USER_UPDATED",
    resource: "users",
    resourceId: targetId,
    oldValues: old,
    newValues: updates,
  });

  res.json(sanitizeUser(user));
};

exports.deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.id === req.user.sub) {
    return res.status(400).json({ error: "Cannot deactivate yourself" });
  }

  await user.update({ isActive: false });
  await AuditLog.create({
    userId: req.user.sub,
    action: "USER_DEACTIVATED",
    resource: "users",
    resourceId: user.id,
  });

  res.json({ message: "User deactivated successfully" });
};

exports.getAuditLogs = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = (page - 1) * limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "email"] }],
  });

  res.json({
    data: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  });
};
