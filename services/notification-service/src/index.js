require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { sequelize } = require("./models");
const { createMailTransporter, verifySmtp } = require("./utils/smtp");

const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));

const { transporter, configured, user: smtpUser, reason } = createMailTransporter();

if (!configured) {
  console.warn("[notification-service] SMTP not configured:", reason);
} else {
  verifySmtp(transporter)
    .then(() => console.log(`[notification-service] SMTP ready (${smtpUser})`))
    .catch((err) =>
      console.error("[notification-service] SMTP verify failed:", err.message)
    );
}

const brandHtml = (body) => `
<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f7f9fc">
  <div style="background:#ffffff;border:1px solid #E8EDF3;border-radius:16px;padding:28px">
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.05em;color:#6B778C;text-transform:uppercase">TWZ Fire Safety</p>
    ${body}
    <p style="margin:24px 0 0;font-size:12px;color:#6B778C">Executive Safety Intelligence Platform</p>
  </div>
</div>`;

const templates = {
  welcome: ({ name, tempPassword, role, email }) => ({
    subject: "Welcome to TWZ Fire Safety System — your login credentials",
    html: brandHtml(`
      <h2 style="color:#172B4D;margin:0 0 12px">Welcome, ${name}</h2>
      <p style="color:#44474c">Your TWZ Fire Safety account is ready. Sign in with the credentials below, then you will be asked to verify your email with a one-time code and set a new password.</p>
      <ul style="color:#44474c;line-height:1.8;margin:16px 0;padding-left:20px">
        <li><strong>Email:</strong> ${email || "your registered address"}</li>
        <li><strong>Role:</strong> ${role}</li>
        <li><strong>Temporary password:</strong> <span style="font-family:monospace;font-size:16px;letter-spacing:1px">${tempPassword}</span></li>
      </ul>
      <p style="color:#ba1a1a;font-size:13px">For security, change this password immediately after your first sign-in.</p>
      <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" style="color:#006b5f;font-weight:600">Sign in to the portal</a></p>
    `),
  }),

  otp: ({ name, otp, purpose }) => ({
    subject: `Your verification code: ${otp}`,
    html: brandHtml(`
      <h2 style="color:#172B4D;margin:0 0 8px">Hello ${name}</h2>
      <p style="color:#44474c">Use this code for <strong>${purpose}</strong>. It expires in 10 minutes.</p>
      <div style="background:#0b1f33;color:#ffffff;text-align:center;padding:20px;border-radius:12px;margin:16px 0">
        <span style="font-size:32px;font-family:monospace;letter-spacing:10px;font-weight:700">${otp}</span>
      </div>
    `),
  }),

  password_reset: ({ name, otp }) => ({
    subject: "Password reset code",
    html: brandHtml(`
      <h2 style="color:#172B4D;margin:0 0 8px">Password reset</h2>
      <p style="color:#44474c">Hello ${name}, your reset code:</p>
      <div style="font-size:32px;font-family:monospace;letter-spacing:8px;font-weight:700;color:#172B4D">${otp}</div>
    `),
  }),

  inspection_scheduled: ({ scheduledDate, extinguisherId, inspectionId, serialNumber, location }) => ({
    subject: "Inspection assigned — TWZ Fire System",
    html: brandHtml(`
      <h2 style="color:#172B4D">Inspection assigned to you</h2>
      <p style="color:#44474c">Open the portal to view details and complete the inspection when done.</p>
      <ul style="color:#44474c;line-height:1.8">
        <li><strong>Date:</strong> ${new Date(scheduledDate).toLocaleString()}</li>
        ${serialNumber ? `<li><strong>Serial:</strong> ${serialNumber}</li>` : ""}
        ${location ? `<li><strong>Location:</strong> ${location}</li>` : ""}
        ${!serialNumber ? `<li><strong>Extinguisher ID:</strong> ${extinguisherId}</li>` : ""}
        ${inspectionId ? `<li><strong>Inspection ID:</strong> ${inspectionId}</li>` : ""}
      </ul>
      <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/inspections" style="color:#006b5f;font-weight:600">Open Inspections</a></p>
    `),
  }),

  inspection_completed: ({
    serialNumber,
    location,
    result,
    completedDate,
    inspectorName,
    inspectorEmail,
    findings,
    inspectionId,
  }) => ({
    subject: `Inspection completed — ${result || "update"} (${serialNumber || inspectionId})`,
    html: brandHtml(`
      <h2 style="color:#172B4D">Inspection completed</h2>
      <p style="color:#44474c">An inspector has finished a field inspection. Summary below.</p>
      <ul style="color:#44474c;line-height:1.8">
        <li><strong>Result:</strong> ${(result || "—").replace(/_/g, " ")}</li>
        <li><strong>Completed:</strong> ${new Date(completedDate).toLocaleString()}</li>
        ${serialNumber ? `<li><strong>Serial:</strong> ${serialNumber}</li>` : ""}
        ${location ? `<li><strong>Location:</strong> ${location}</li>` : ""}
        <li><strong>Inspector:</strong> ${inspectorName || inspectorEmail || "—"}</li>
        ${findings ? `<li><strong>Findings:</strong> ${findings}</li>` : ""}
        ${inspectionId ? `<li><strong>Inspection ID:</strong> ${inspectionId}</li>` : ""}
      </ul>
      <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/inspections" style="color:#006b5f;font-weight:600">View in admin portal</a></p>
    `),
  }),
};

app.get("/api/notifications/smtp-status", async (req, res) => {
  if (!configured || !transporter) {
    return res.json({ configured: false, verified: false, error: reason || "Not configured" });
  }
  try {
    await verifySmtp(transporter);
    res.json({ configured: true, verified: true, host: process.env.SMTP_HOST, user: smtpUser });
  } catch (err) {
    res.json({ configured: true, verified: false, error: err.message, user: smtpUser });
  }
});

app.post("/api/notifications/send", async (req, res) => {
  const { type, payload } = req.body;
  const template = templates[type];
  if (!template) {
    return res.status(400).json({ error: "Unknown notification type" });
  }

  const toEmail = payload?.email?.toLowerCase?.() || payload?.email;
  if (!toEmail) {
    return res.status(400).json({ error: "Email address required" });
  }

  const { subject, html } = template(payload);

  if (!configured || !transporter) {
    console.warn(`[notification-service] SMTP skip ${type} → ${toEmail}`, payload.otp || "");
    if (process.env.NODE_ENV !== "production" && (payload.otp || payload.tempPassword)) {
      return res.json({
        success: true,
        emailSent: false,
        devFallback: true,
        otp: payload.otp,
        tempPassword: payload.tempPassword,
        message: "SMTP not configured; credentials returned for development only",
      });
    }
    return res.status(503).json({ error: "Email service not configured" });
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "TWZ Fire Safety <no-reply@twzltd.com>",
      to: toEmail,
      subject,
      html,
    });
    console.log(`[notification-service] Email sent: ${type} → ${toEmail}`);
    return res.json({ success: true, emailSent: true });
  } catch (err) {
    console.error("[notification-service] Email error:", err.message);
    if (process.env.NODE_ENV !== "production" && (payload.otp || payload.tempPassword)) {
      return res.json({
        success: true,
        emailSent: false,
        devFallback: true,
        otp: payload.otp,
        tempPassword: payload.tempPassword,
        error: err.message,
      });
    }
    return res.status(500).json({ error: "Failed to send email", details: err.message });
  }
});

app.get("/health", (req, res) =>
  res.json({
    service: "notification-service",
    status: "ok",
    port: process.env.PORT || 3005,
    smtpConfigured: configured,
  })
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
