const { DataTypes } = require("sequelize");
module.exports = (sequelize) => sequelize.define("User", {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName:          { type: DataTypes.STRING(50),  allowNull: false, validate: { notEmpty: true, len: [2,50] } },
  lastName:           { type: DataTypes.STRING(50),  allowNull: false, validate: { notEmpty: true, len: [2,50] } },
  email:              { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { isEmail: true } },
  password:           { type: DataTypes.STRING(255), allowNull: false },
  role:               { type: DataTypes.ENUM("admin","inspector","user"), defaultValue: "user" },
  isActive:           { type: DataTypes.BOOLEAN, defaultValue: true },
  mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: true },
  isEmailVerified:    { type: DataTypes.BOOLEAN, defaultValue: false },
  phone:              { type: DataTypes.STRING(20) },
  department:         { type: DataTypes.STRING(100) },
  lastLoginAt:        { type: DataTypes.DATE },
  passwordChangedAt:  { type: DataTypes.DATE },
  profileImage:       { type: DataTypes.STRING(500) },
}, {
  tableName: "users", timestamps: true,
  indexes: [{ unique: true, fields: ["email"] }]
});