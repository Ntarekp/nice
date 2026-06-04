const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "OtpCode",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "user_id",
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { isEmail: true },
      },
      otpCode: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: "otp_code",
      },
      purpose: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "login",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_used",
      },
    },
    {
      tableName: "otp_codes",
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ["user_id", "purpose", "is_used"] },
        { fields: ["email", "purpose", "is_used"] },
        { fields: ["expires_at"] },
      ],
    }
  );
