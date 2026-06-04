const { DataTypes } = require("sequelize");
module.exports = (sequelize) => sequelize.define("Inspection", {
  id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  extinguisherId:    { type: DataTypes.UUID, allowNull: false },
  scheduledBy:       { type: DataTypes.UUID, allowNull: false },
  assignedInspector: { type: DataTypes.UUID },
  scheduledDate:     { type: DataTypes.DATE, allowNull: false },
  completedDate:     { type: DataTypes.DATE },
  status:            { type: DataTypes.ENUM("scheduled","in_progress","completed","missed","cancelled"), defaultValue: "scheduled" },
  type:              { type: DataTypes.ENUM("routine","annual","emergency","post_maintenance","compliance"), defaultValue: "routine" },
  result:            { type: DataTypes.ENUM("passed","failed","needs_maintenance","decommissioned") },
  findings:          { type: DataTypes.TEXT },
  notes:             { type: DataTypes.TEXT },
  nextInspectionDate:{ type: DataTypes.DATEONLY },
  notifiedAt:        { type: DataTypes.DATE },
}, { tableName: "inspections", timestamps: true,
  indexes: [{ fields: ["extinguisherId"] }, { fields: ["scheduledDate"] }, { fields: ["status"] }] });