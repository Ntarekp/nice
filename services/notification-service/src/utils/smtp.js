const nodemailer = require("nodemailer");

/** Gmail app passwords are 16 chars; strip quotes/spaces from .env values. */
function cleanSmtpPass(raw) {
  if (!raw) return "";
  return String(raw).replace(/^["']|["']$/g, "").replace(/\s+/g, "");
}

function createMailTransporter() {
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = cleanSmtpPass(process.env.SMTP_PASS);

  if (!user || !pass) {
    return { transporter: null, configured: false, reason: "SMTP_USER or SMTP_PASS missing" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
    tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
  });

  return { transporter, configured: true, user };
}

async function verifySmtp(transporter) {
  await transporter.verify();
}

module.exports = { cleanSmtpPass, createMailTransporter, verifySmtp };
