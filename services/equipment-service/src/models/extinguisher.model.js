const { DataTypes } = require("sequelize");
module.exports = (sequelize) => sequelize.define("Extinguisher", {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  serialNumber:     { type: DataTypes.STRING(50),  allowNull: false, unique: true },
  location:         { type: DataTypes.STRING(200), allowNull: false },
  building:         { type: DataTypes.STRING(100) },
  floor:            { type: DataTypes.STRING(20)  },
  room:             { type: DataTypes.STRING(50)  },
  type:             { type: DataTypes.ENUM("water","co2","foam","dry_chemical","wet_chemical","halon"), allowNull: false },
  size:             { type: DataTypes.ENUM("2.5lbs","5lbs","9lbs","12lbs","20lbs"), allowNull: false },
  manufacturer:     { type: DataTypes.STRING(100) },
  model:            { type: DataTypes.STRING(100) },
  installationDate: { type: DataTypes.DATEONLY, allowNull: false },
  expiryDate:       { type: DataTypes.DATEONLY, allowNull: false },
  lastInspectionDate:{ type: DataTypes.DATEONLY },
  nextInspectionDate:{ type: DataTypes.DATEONLY },
  status:           { type: DataTypes.ENUM("active","expired","maintenance","decommissioned","missing"), defaultValue: "active" },
  pressure:         { type: DataTypes.STRING(20) },
  notes:            { type: DataTypes.TEXT },
  qrCode:           { type: DataTypes.STRING(500) },
  createdBy:        { type: DataTypes.UUID },
}, {
  tableName: "extinguishers", timestamps: true,
  indexes: [
    { unique: true, fields: ["serialNumber"] },
    { fields: ["status"] }, { fields: ["expiryDate"] }, { fields: ["location"] }
  ]
});