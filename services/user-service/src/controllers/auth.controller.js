const axios = require("axios");
const { User, RefreshToken, AuditLog } = require("../models");
const { generateTokens, verifyRefresh } = require("../utils/jwt");
const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} = require("../utils/password");
const { storeOTP, verifyOTP } = require("../utils/otp");

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL;

const sendNotification = async (type, payload) => {
  try {
    await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, {
      type,
      payload,
    });
  } catch (e) {
    console.error("[user-service] Notification send failed:", e.message);
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
  await sendNotification("otp", {
    email: user.email,
    name: user.firstName,
    otp,
    purpose: "account registration",
  });

  await AuditLog.create({
    userId: user.id,
    action: "USER_REGISTERED",
    status: "success",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    message: "Registration successful. OTP sent to your email for verification.",
    userId: user.id,
    requiresOtp: true,
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

  if (!user.isEmailVerified) {
    const otp = await storeOTP(user.id, "register");
    await sendNotification("otp", {
      email: user.email,
      name: user.firstName,
      otp,
      purpose: "account verification",
    });
    return res.status(403).json({
      error: "Email not verified. A new OTP has been sent to your email.",
      userId: user.id,
      requiresOtp: true,
    });
  }

  const { accessToken, refreshToken } = await issueSession(user, req);

  await AuditLog.create({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    status: "success",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.json({
    message: "Login successful",
    accessToken,
    refreshToken,
    mustChangePassword: user.mustChangePassword,
    user: sanitizeUser(user),
  });
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  const { userId, otp, purpose = "register" } = req.body;

  const result = await verifyOTP(userId, purpose, otp);
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
