const { User, AuditLog } = require("../models");
const { hashPassword, generateTempPassword } = require("../utils/password");
const { sendNotification } = require("../utils/notifications");
const { Op } = require("sequelize");

const sanitizeUser = (user) => {
  const { password, ...safe } = user.toJSON();
  return safe;
};

exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, department } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const tempPassword = generateTempPassword();
    const hashed = await hashPassword(tempPassword);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashed,
      role: role || "user",
      phone: phone?.trim() || null,
      department: department?.trim() || null,
      mustChangePassword: true,
      isEmailVerified: true,
      isActive: true,
    });

    const mail = await sendNotification("welcome", {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      tempPassword,
      role: user.role,
    });

    try {
      await AuditLog.create({
        userId: req.user.sub,
        action: "USER_CREATED",
        resource: "users",
        resourceId: user.id,
        newValues: {
          email: user.email,
          role: user.role,
          welcomeEmailSent: mail.emailSent !== false,
        },
      });
    } catch (logErr) {
      console.error("[user-service] Audit log failed (user still created):", logErr.message);
    }

    const emailSent = mail.emailSent !== false;
    const payload = {
      message: emailSent
        ? "User created. Welcome email with temporary password sent."
        : "User created. Welcome email could not be sent — share the temporary password manually.",
      emailSent,
      emailError: emailSent ? undefined : mail.error,
      user: sanitizeUser(user),
    };

    if (process.env.NODE_ENV !== "production") {
      payload.devPasswordHint = mail.devFallback ? mail.tempPassword || tempPassword : tempPassword;
    }

    return res.status(201).json(payload);
  } catch (err) {
    console.error("[user-service] createUser failed:", err.message);
    if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error: err.errors?.[0]?.message || "Invalid user data",
      });
    }
    return res.status(500).json({ error: "Failed to create user" });
  }
};

exports.listUsers = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;
  const { role, isActive, search } = req.query;

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  } else if (req.query.activeOnly !== "false") {
    where.isActive = true;
  }
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
