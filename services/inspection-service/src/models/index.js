const { Sequelize } = require("sequelize");
const defineInspection = require("./inspection.model");
const defineMaintenanceLog = require("./maintenance-log.model");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

const Inspection = defineInspection(sequelize);
const MaintenanceLog = defineMaintenanceLog(sequelize);

Inspection.hasMany(MaintenanceLog, {
  foreignKey: "inspectionId",
  as: "maintenanceLogs",
});
MaintenanceLog.belongsTo(Inspection, {
  foreignKey: "inspectionId",
  as: "inspection",
});

module.exports = { sequelize, Inspection, MaintenanceLog };
