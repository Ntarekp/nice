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
const isLocalDevOrigin = (origin) =>
  process.env.NODE_ENV !== "production" &&
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
      return cb(null, true);
    }
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
const otpLimiter  = rateLimit({ windowMs: 10 * 60 * 1000, max: 30,
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
// v3 + app.use(mount, proxy) strips the mount path (e.g. /api/auth/login → /login).
// Use pathFilter on the full URL so backends still receive /api/... paths.
const proxy = (target, pathPrefix) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter: pathPrefix,
    on: {
      error: (err, req, res) => {
        console.error(`[Proxy] Error → ${target}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: "Service temporarily unavailable" });
        }
      },
    },
  });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth/login",   authLimiter);
app.use("/api/auth/verify-otp", otpLimiter);
app.use("/api/auth/register",   authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/verify-reset-otp", otpLimiter);
app.use("/api/auth/reset-password", authLimiter);

const userService = process.env.USER_SERVICE_URL || "http://localhost:3001";
app.use(proxy(userService, "/api/auth"));
app.use(proxy(userService, "/api/users"));
app.use(proxy(process.env.EQUIPMENT_SERVICE_URL || "http://localhost:3002", "/api/extinguishers"));
app.use(proxy(process.env.INSPECTION_SERVICE_URL || "http://localhost:3003", "/api/inspections"));
app.use(proxy(process.env.INSPECTION_SERVICE_URL || "http://localhost:3003", "/api/maintenance"));
app.use(proxy(process.env.REPORT_SERVICE_URL || "http://localhost:3004", "/api/reports"));
app.use(proxy(process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3005", "/api/notifications"));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway   :${PORT}  /api-docs`));