const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateTokens = (user) => {
  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken  = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
  const refreshToken = jwt.sign(
    { sub: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

const verifyAccess  = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefresh = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

/** Short-lived token after reset OTP is verified — used only for POST /reset-password */
const generateResetToken = (userId) =>
  jwt.sign(
    { sub: userId, purpose: "password_reset" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

const verifyResetToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== "password_reset") {
    throw new Error("Invalid reset token");
  }
  return decoded;
};

module.exports = {
  generateTokens,
  generateResetToken,
  verifyAccess,
  verifyRefresh,
  verifyResetToken,
};