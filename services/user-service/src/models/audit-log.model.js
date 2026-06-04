const { DataTypes } = require("sequelize");
module.exports = (sequelize) => sequelize.define("AuditLog", {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:     { type: DataTypes.UUID },
  action:     { type: DataTypes.STRING(100), allowNull: false },
  resource:   { type: DataTypes.STRING(100) },
  resourceId: { type: DataTypes.STRING(100) },
  oldValues:  { type: DataTypes.JSONB },
  newValues:  { type: DataTypes.JSONB },
  ipAddress:  { type: DataTypes.STRING(45) },
  userAgent:  { type: DataTypes.STRING(500) },
  status:     { type: DataTypes.ENUM("success","failure"), defaultValue: "success" },
}, { tableName: "audit_logs", timestamps: true, updatedAt: false });