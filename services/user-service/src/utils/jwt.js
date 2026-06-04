const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateTokens = (user) => {
  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken  = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(
    { sub: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

const verifyAccess  = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefresh = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = { generateTokens, verifyAccess, verifyRefresh };