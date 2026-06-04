const crypto = require("crypto");
const { OtpCode, User } = require("../models");

const OTP_TTL_SEC = parseInt(process.env.OTP_TTL_SECONDS, 10) || 600;

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const storeOTP = async (userId, purpose) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_SEC * 1000);

  await OtpCode.update(
    { isUsed: true },
    { where: { userId, purpose, isUsed: false } }
  );

  await OtpCode.create({
    userId,
    email: user.email,
    otpCode: otp,
    purpose,
    expiresAt,
    isUsed: false,
  });

  return otp;
};

const verifyOTP = async (userId, purpose, submitted) => {
  const record = await OtpCode.findOne({
    where: { userId, purpose, isUsed: false },
    order: [["createdAt", "DESC"]],
  });

  if (!record) {
    return { valid: false, reason: "OTP expired or not found" };
  }

  if (new Date() > record.expiresAt) {
    await record.update({ isUsed: true });
    return { valid: false, reason: "OTP expired or not found" };
  }

  if (record.otpCode !== submitted) {
    return { valid: false, reason: "Invalid OTP" };
  }

  await record.update({ isUsed: true });
  return { valid: true };
};

const invalidateOTP = async (userId, purpose) => {
  await OtpCode.update(
    { isUsed: true },
    { where: { userId, purpose, isUsed: false } }
  );
};

module.exports = { generateOTP, storeOTP, verifyOTP, invalidateOTP };
