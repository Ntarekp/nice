require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const nodemailer = require("nodemailer");
const { sequelize } = require("./models");

const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
});

const templates = {
  welcome: ({ name, tempPassword, role }) => ({
    subject: "Welcome to TWZ Fire Safety System",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px">
      <h2>TWZ Fire Safety Management</h2>
      <p>Welcome, ${name}! Your role: <strong>${role}</strong>.</p>
      <p>Temporary password: <strong>${tempPassword}</strong></p>
      <p>Login: <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}">${process.env.FRONTEND_URL || "http://localhost:5173"}</a></p>
    </div>`,
  }),

  otp: ({ name, otp, purpose }) => ({
    subject: `Your OTP Code — ${otp}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px">
      <h3>Hello ${name},</h3>
      <p>Your OTP for <strong>${purpose}</strong>:</p>
      <div style="background:#1a1a2e;color:white;text-align:center;padding:20px;border-radius:8px">
        <span style="font-size:36px;font-family:monospace;letter-spacing:8px;font-weight:bold">${otp}</span>
      </div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
    </div>`,
  }),

  password_reset: ({ name, otp }) => ({
    subject: "Password Reset OTP",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px">
      <h3>Password Reset</h3>
      <p>Hello ${name}, your reset OTP:</p>
      <div style="font-size:36px;font-family:monospace;letter-spacing:8px;font-weight:bold">${otp}</div>
      <p>Expires in 10 minutes.</p>
    </div>`,
  }),

  inspection_scheduled: ({ scheduledDate, extinguisherId, inspectionId, email }) => ({
    subject: "Inspection Scheduled — TWZ Fire System",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px">
      <h3>Inspection Assigned</h3>
      <p>Hello,</p>
      <p>An inspection has been scheduled for you:</p>
      <ul>
        <li><strong>Date:</strong> ${new Date(scheduledDate).toLocaleString()}</li>
        <li><strong>Extinguisher ID:</strong> ${extinguisherId}</li>
        ${inspectionId ? `<li><strong>Inspection ID:</strong> ${inspectionId}</li>` : ""}
      </ul>
      <p>Recipient: ${email || "assigned inspector"}</p>
      <p>Please log in to the TWZ Fire Safety System for full details.</p>
    </div>`,
  }),
};

// POST /api/notifications/send (internal)
app.post("/api/notifications/send", async (req, res) => {
  const { type, payload } = req.body;
  const template = templates[type];
  if (!template) {
    return res.status(400).json({ error: "Unknown notification type" });
  }

  const toEmail = payload?.email;
  if (!toEmail) {
    return res.status(400).json({ error: "Email address required" });
  }

  const { subject, html } = template(payload);

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "TWZ Fire Safety <no-reply@twzltd.com>",
        to: toEmail,
        subject,
        html,
      });
      console.log(`[notification-service] Email sent: ${type} → ${toEmail}`);
    } else {
      console.log(
        `[notification-service] SMTP not configured — ${type} → ${toEmail}`,
        payload.otp ? `(OTP: ${payload.otp})` : ""
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[notification-service] Email error:", err.message);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

app.get("/health", (req, res) =>
  res.json({ service: "notification-service", status: "ok", port: 3005 })
);

app.use((err, req, res, next) => {
  console.error("[notification-service]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

const PORT = parseInt(process.env.PORT, 10) || 3005;

sequelize
  .sync({ alter: process.env.NODE_ENV !== "production" })
  .then(() => app.listen(PORT, () => console.log(`notification-service on :${PORT}`)))
  .catch((err) => {
    console.error("DB sync failed:", err);
    process.exit(1);
  });
