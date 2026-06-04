const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const SALT_ROUNDS = 12;

const hashPassword   = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

const generateTempPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  return Array.from(crypto.randomBytes(12)).map(b => chars[b % chars.length]).join("");
};

const validatePasswordStrength = (pw) => {
  const errs = [];
  if (pw.length < 8)          errs.push("At least 8 characters");
  if (!/[A-Z]/.test(pw))      errs.push("At least one uppercase letter");
  if (!/[a-z]/.test(pw))      errs.push("At least one lowercase letter");
  if (!/[0-9]/.test(pw))      errs.push("At least one number");
  if (!/[!@#$%^&*]/.test(pw)) errs.push("At least one special character (!@#\$%^&*)");
  return errs;
};

module.exports = { hashPassword, comparePassword, generateTempPassword, validatePasswordStrength };