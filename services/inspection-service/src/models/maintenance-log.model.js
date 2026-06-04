const { DataTypes } = require("sequelize");
module.exports = (sequelize) => sequelize.define("MaintenanceLog", {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  extinguisherId: { type: DataTypes.UUID, allowNull: false },
  inspectionId:   { type: DataTypes.UUID },
  performedBy:    { type: DataTypes.UUID, allowNull: false },
  actionDate:     { type: DataTypes.DATEONLY, allowNull: false },
  actionsTaken:   { type: DataTypes.TEXT, allowNull: false },
  conditionsNoted:{ type: DataTypes.TEXT },
  partsReplaced:  { type: DataTypes.JSONB, defaultValue: [] },
  cost:           { type: DataTypes.DECIMAL(10,2) },
  nextServiceDate:{ type: DataTypes.DATEONLY },
  status:         { type: DataTypes.ENUM("completed","pending_parts","decommissioned"), defaultValue: "completed" },
}, { tableName: "maintenance_logs", timestamps: true });