const { DataTypes } = require("sequelize");
module.exports = (sequelize) => sequelize.define("RefreshToken", {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId:    { type: DataTypes.UUID, allowNull: false },
  token:     { type: DataTypes.TEXT, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  isRevoked: { type: DataTypes.BOOLEAN, defaultValue: false },
  userAgent: { type: DataTypes.STRING(500) },
  ipAddress: { type: DataTypes.STRING(45) },
}, { tableName: "refresh_tokens", timestamps: true });