const { User } = require("../models");

/** Service-to-service: active admin emails for completion notifications. */
exports.listAdminEmails = async (req, res) => {
  const key = req.headers["x-service-key"];
  const expected = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET;
  if (!key || !expected || key !== expected) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const admins = await User.findAll({
    where: { role: "admin", isActive: true },
    attributes: ["email", "firstName", "lastName"],
    order: [["createdAt", "ASC"]],
  });

  res.json({ data: admins });
};

exports.getUserBrief = async (req, res) => {
  const key = req.headers["x-service-key"];
  const expected = process.env.INTERNAL_API_KEY || process.env.JWT_SECRET;
  if (!key || !expected || key !== expected) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const user = await User.findByPk(req.params.id, {
    attributes: ["id", "email", "firstName", "lastName", "role"],
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
};
