require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
const fs = require("fs");

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Refresh-Token"]
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20,
  message: { error: "Too many auth attempts" } });
const otpLimiter  = rateLimit({ windowMs: 10 * 60 * 1000, max: 5,
  message: { error: "Too many OTP attempts" } });

app.use(morgan("combined"));

// ── Swagger ───────────────────────────────────────────────────────────────────
const swaggerFile = path.join(__dirname, "swagger.json");
if (fs.existsSync(swaggerFile)) {
  const swaggerDoc = require(swaggerFile);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customCss: ".swagger-ui .topbar { background: #1a1a2e; }",
    customSiteTitle: "TWZ Fire System API"
  }));
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// ── Proxy helpers ─────────────────────────────────────────────────────────────
const proxy = (target) => createProxyMiddleware({
  target, changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error(`[Proxy] Error → ${target}:`, err.message);
      res.status(502).json({ error: "Service temporarily unavailable" });
    }
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth/login",   authLimiter);
app.use("/api/auth/verify-otp", otpLimiter);
app.use("/api/auth/register",   authLimiter);
app.use("/api/auth",         proxy(process.env.USER_SERVICE_URL      || "http://localhost:3001"));
app.use("/api/users",        proxy(process.env.USER_SERVICE_URL      || "http://localhost:3001"));
app.use("/api/extinguishers",proxy(process.env.EQUIPMENT_SERVICE_URL || "http://localhost:3002"));
app.use("/api/inspections",  proxy(process.env.INSPECTION_SERVICE_URL|| "http://localhost:3003"));
app.use("/api/maintenance",  proxy(process.env.INSPECTION_SERVICE_URL|| "http://localhost:3003"));
app.use("/api/reports",      proxy(process.env.REPORT_SERVICE_URL    || "http://localhost:3004"));
app.use("/api/notifications",proxy(process.env.NOTIFICATION_SERVICE_URL|| "http://localhost:3005"));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway   :${PORT}  /api-docs`));