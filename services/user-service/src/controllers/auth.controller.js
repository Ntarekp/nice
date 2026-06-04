const axios = require("axios");
const { User, RefreshToken, AuditLog } = require("../models");
const {
  generateTokens,
  generateResetToken,
  verifyRefresh,
  verifyResetToken,
} = require("../utils/jwt");
const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} = require("../utils/password");
const { storeOTP, verifyOTP } = require("../utils/otp");

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL;

const sendNotification = async (type, payload, { required = false } = {}) => {
  try {
    const { data } = await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, {
      type,
      payload,
    }, { timeout: 20000 });

    if (data.devFallback) {
      console.warn(
        `[user-service] Email dev fallback ${type} → ${payload.email} OTP logged server-side`
      );
    }
    return data;
  } catch (e) {
    const detail = e.response?.data?.error || e.response?.data?.details || e.message;
    console.error("[user-service] Notification send failed:", detail);
    if (required) {
      const err = new Error(detail || "Failed to send email");
      err.status = e.response?.status || 503;
      throw err;
    }
    return { success: false, emailSent: false, error: detail };
  }
};

const sanitizeUser = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  mustChangePassword: user.mustChangePassword,
});

const persistRefreshToken = async (user, refreshToken, req) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  });
};

const issueSession = async (user, req) => {
  const { accessToken, refreshToken } = generateTokens(user);
  await persistRefreshToken(user, refreshToken, req);
  await user.update({ lastLoginAt: new Date() });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const pwErrors = validatePasswordStrength(password);
  if (pwErrors.length) {
    return res.status(400).json({ error: "Weak password", details: pwErrors });
  }

  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hashed = await hashPassword(password);
  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password: hashed,
    role: "user",
    isActive: true,
    isEmailVerified: false,
    mustChangePassword: false,
  });

  const otp = await storeOTP(user.id, "register");
  const mail = await sendNotification(
    "otp",
    {
      email: user.email,
      name: user.firstName,
      otp,
      purpose: "account registration",
    },
    { required: true }
  );

  await AuditLog.create({
    userId: user.id,
    action: "USER_REGISTERED",
    status: "success",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    message: mail.emailSent
      ? "Registration successful. OTP sent to your email for verification."
      : "Registration successful. Check your email for the verification code.",
    userId: user.id,
    requiresOtp: true,
    emailSent: mail.emailSent !== false,
  });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    if (user) {
      await AuditLog.create({
        userId: user.id,
        action: "LOGIN_FAILED",
        status: "failure",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const otpPurpose = user.isEmailVerified ? "login" : "register";
  const otp = await storeOTP(user.id, otpPurpose);
  const mail = await sendNotification(
    "otp",
    {
      email: user.email,
      name: user.firstName,
      otp,
      purpose: user.isEmailVerified ? "sign in" : "account verification",
    },
    { required: false }
  );

  await AuditLog.create({
    userId: user.id,
    action: "LOGIN_OTP_SENT",
    status: "success",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const payload = {
    message: "Verification code sent to your email",
    userId: user.id,
    requiresOtp: true,
    purpose: otpPurpose,
    emailSent: mail.emailSent !== false,
    mustChangePassword: user.mustChangePassword,
  };

  if (process.env.NODE_ENV !== "production") {
    payload.devOtpHint = mail.otp || otp;
  }

  return res.status(403).json(payload);
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  const { userId, otp, purpose = "register" } = req.body;
  const allowedPurpose = purpose === "login" ? "login" : "register";

  const result = await verifyOTP(userId, allowedPurpose, otp);
  if (!result.valid) {
    return res.status(401).json({ error: result.reason });
  }

  const user = await User.findByPk(userId);
  if (!user || !user.isActive) {
    return res.status(404).json({ error: "User not found" });
  }

  if (purpose === "register" && !user.isEmailVerified) {
    await user.update({ isEmailVerified: true });
    await user.reload();
    await AuditLog.create({
      userId: user.id,
      action: "EMAIL_VERIFIED",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  const { accessToken, refreshToken } = await issueSession(user, req);

  await AuditLog.create({
    userId: user.id,
    action: "OTP_VERIFIED",
    status: "success",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.json({
    message:
      purpose === "register"
        ? "Account verified successfully"
        : "OTP verified successfully",
    accessToken,
    refreshToken,
    mustChangePassword: user.mustChangePassword,
    user: sanitizeUser(user),
  });
};

// POST /api/auth/refresh-token (alias: /refresh)
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  let decoded;
  try {
    decoded = verifyRefresh(refreshToken);
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }

  const tokenRecord = await RefreshToken.findOne({
    where: { token: refreshToken, userId: decoded.sub, isRevoked: false },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    return res.status(401).json({ error: "Refresh token expired or revoked" });
  }

  const user = await User.findByPk(decoded.sub);
  if (!user || !user.isActive || !user.isEmailVerified) {
    return res.status(401).json({ error: "User inactive or not verified" });
  }

  await tokenRecord.update({ isRevoked: true });
  const tokens = generateTokens(user);
  await persistRefreshToken(user, tokens.refreshToken, req);

  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { token: refreshToken } }
    );
  }

  const userId = req.user?.sub;
  if (userId) {
    await AuditLog.create({
      userId,
      action: "LOGOUT",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  res.json({ message: "Logged out successfully" });
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.sub);

  if (!user || !user.isActive) {
    return res.status(404).json({ error: "User not found" });
  }

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }

  const pwErrors = validatePasswordStrength(newPassword);
  if (pwErrors.length) {
    return res.status(400).json({ error: "Weak password", details: pwErrors });
  }

  const hashed = await hashPassword(newPassword);
  await user.update({
    password: hashed,
    mustChangePassword: false,
    passwordChangedAt: new Date(),
  });

  await RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });

  await AuditLog.create({
    userId: user.id,
    action: "PASSWORD_CHANGED",
    status: "success",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.json({ message: "Password changed successfully" });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const normalizedEmail = req.body.email?.toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  let devOtpHint;
  let emailSent = false;
  if (user && user.isActive && user.isEmailVerified) {
    const otp = await storeOTP(user.id, "reset");
    const mail = await sendNotification("password_reset", {
      email: user.email,
      name: user.firstName,
      otp,
    });
    emailSent = mail.emailSent !== false;
    if (process.env.NODE_ENV !== "production") {
      devOtpHint = mail.otp || otp;
    }
    await AuditLog.create({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  const body = {
    message:
      "If an account matches this email, a password reset code has been sent.",
    emailSent: emailSent || undefined,
  };
  if (devOtpHint) body.devOtpHint = devOtpHint;
  res.json(body);
};

// POST /api/auth/verify-reset-otp — consumes one-time reset code; returns short-lived resetToken
exports.verifyResetOtp = async (req, res) => {
  const normalizedEmail = req.body.email?.toLowerCase();
  const { otp } = req.body;

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user || !user.isActive || !user.isEmailVerified) {
    return res.status(400).json({ error: "Invalid or expired reset code. Request a new code." });
  }

  const result = await verifyOTP(user.id, "reset", otp);
  if (!result.valid) {
    return res.status(400).json({ error: result.reason });
  }

  const resetToken = generateResetToken(user.id);

  res.json({
    message: "Reset code verified. Choose a new password.",
    resetToken,
    email: user.email,
  });
};

// POST /api/auth/reset-password — requires resetToken from verify-reset-otp (OTP already consumed)
exports.resetPassword = async (req, res) => {
  const normalizedEmail = req.body.email?.toLowerCase();
  const { resetToken, newPassword } = req.body;

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user || !user.isActive) {
    return res.status(400).json({ error: "Unable to reset password. Request a new code." });
  }

  if (!resetToken) {
    return res.status(400).json({
      error: "Reset session expired. Request a new code from Forgot Password.",
    });
  }

  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch {
    return res.status(400).json({
      error: "Reset session expired. Request a new code from Forgot Password.",
    });
  }

  if (decoded.sub !== user.id) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const pwErrors = validatePasswordStrength(newPassword);
  if (pwErrors.length) {
    return res.status(400).json({ error: "Weak password", details: pwErrors });
  }

  const hashed = await hashPassword(newPassword);
  await user.update({
    password: hashed,
    mustChangePassword: false,
    passwordChangedAt: new Date(),
  });

  await RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });

  await AuditLog.create({
    userId: user.id,
    action: "PASSWORD_RESET",
    status: "success",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.json({
    message: "Password reset successfully. Please log in.",
  });
};
