const { Sequelize } = require("sequelize");
const defineUser = require("./user.model");
const defineRefreshToken = require("./refresh-token.model");
const defineAuditLog = require("./audit-log.model");
const defineOtpCode = require("./otp-code.model");

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

const User = defineUser(sequelize);
const RefreshToken = defineRefreshToken(sequelize);
const AuditLog = defineAuditLog(sequelize);
const OtpCode = defineOtpCode(sequelize);

User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens", onDelete: "CASCADE" });
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(OtpCode, { foreignKey: "userId", as: "otpCodes" });
OtpCode.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = { sequelize, User, RefreshToken, AuditLog, OtpCode };
