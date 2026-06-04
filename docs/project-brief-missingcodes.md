I'll design and build this complete Fire Extinguisher Management System. Let me plan everything carefully first, then deliver the full codebase.

**Architecture Plan:**
- **Backend**: Node.js (Express) microservices — User Service, Equipment Service, Inspection Service, Report Service, Notification Service, API Gateway
- **Database**: PostgreSQL with Sequelize ORM
- **Auth**: JWT + OTP (email-based) + Admin creates users with temp passwords
- **Frontend**: React with a professional dashboard UI
- **Docs**: Swagger UI

Let me build this comprehensively:Now let me build the complete system. I'll deliver this as a comprehensive, well-structured codebase with all the pieces:Here is the complete, production-ready codebase. I'll deliver it in logical sections:

---

## 📁 Project Structure

```
twz-fire-system/
├── docker-compose.yml
├── .env.example
├── api-gateway/
│   ├── package.json
│   └── src/
│       ├── index.js
│       └── middleware/
├── services/
│   ├── user-service/
│   ├── equipment-service/
│   ├── inspection-service/
│   ├── report-service/
│   └── notification-service/
└── frontend/
    └── (React app)
```

---

## 🐳 `docker-compose.yml`

```yaml
version: '3.9'

services:
  postgres-users:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: users_db
      POSTGRES_USER: twz
      POSTGRES_PASSWORD: twzpass
    volumes:
      - pg_users:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  postgres-equipment:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: equipment_db
      POSTGRES_USER: twz
      POSTGRES_PASSWORD: twzpass
    volumes:
      - pg_equipment:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  postgres-inspections:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: inspections_db
      POSTGRES_USER: twz
      POSTGRES_PASSWORD: twzpass
    volumes:
      - pg_inspections:/var/lib/postgresql/data
    ports:
      - "5434:5432"

  postgres-reports:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: reports_db
      POSTGRES_USER: twz
      POSTGRES_PASSWORD: twzpass
    volumes:
      - pg_reports:/var/lib/postgresql/data
    ports:
      - "5435:5432"

  postgres-notifications:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: notifications_db
      POSTGRES_USER: twz
      POSTGRES_PASSWORD: twzpass
    volumes:
      - pg_notifications:/var/lib/postgresql/data
    ports:
      - "5436:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  user-service:
    build: ./services/user-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres-users
      - DB_NAME=users_db
      - DB_USER=twz
      - DB_PASS=twzpass
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - NOTIFICATION_SERVICE_URL=http://notification-service:3005
    depends_on:
      - postgres-users
      - redis

  equipment-service:
    build: ./services/equipment-service
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres-equipment
      - DB_NAME=equipment_db
      - DB_USER=twz
      - DB_PASS=twzpass
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres-equipment

  inspection-service:
    build: ./services/inspection-service
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres-inspections
      - DB_NAME=inspections_db
      - DB_USER=twz
      - DB_PASS=twzpass
      - JWT_SECRET=${JWT_SECRET}
      - NOTIFICATION_SERVICE_URL=http://notification-service:3005
      - EQUIPMENT_SERVICE_URL=http://equipment-service:3002
    depends_on:
      - postgres-inspections

  report-service:
    build: ./services/report-service
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres-reports
      - DB_NAME=reports_db
      - DB_USER=twz
      - DB_PASS=twzpass
      - JWT_SECRET=${JWT_SECRET}
      - EQUIPMENT_SERVICE_URL=http://equipment-service:3002
      - INSPECTION_SERVICE_URL=http://inspection-service:3003
    depends_on:
      - postgres-reports

  notification-service:
    build: ./services/notification-service
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres-notifications
      - DB_NAME=notifications_db
      - DB_USER=twz
      - DB_PASS=twzpass
      - REDIS_URL=redis://redis:6379
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - SMTP_FROM=${SMTP_FROM}
    depends_on:
      - postgres-notifications
      - redis

  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - USER_SERVICE_URL=http://user-service:3001
      - EQUIPMENT_SERVICE_URL=http://equipment-service:3002
      - INSPECTION_SERVICE_URL=http://inspection-service:3003
      - REPORT_SERVICE_URL=http://report-service:3004
      - NOTIFICATION_SERVICE_URL=http://notification-service:3005
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    depends_on:
      - user-service
      - equipment-service
      - inspection-service
      - report-service
      - notification-service

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=http://localhost:3000
    depends_on:
      - api-gateway

volumes:
  pg_users:
  pg_equipment:
  pg_inspections:
  pg_reports:
  pg_notifications:
  redis_data:
```

---

## 📄 `.env.example`

```env
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_refresh_secret_change_this_too
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
SMTP_FROM="TWZ Fire Safety <no-reply@twzltd.com>"
ALLOWED_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173
```

---

## 🚪 API Gateway — `api-gateway/src/index.js`

```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    }
  }
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token']
}));

// ── Rate limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Too many auth attempts, please try again later' }
});
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 5,
  message: { error: 'Too many OTP attempts' }
});

app.use(globalLimiter);
app.use(morgan('combined'));

// ── Swagger Docs ─────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { background: #1a1a2e; }',
  customSiteTitle: 'TWZ Fire System API'
}));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Service proxies ──────────────────────────────────────────────────────────
const proxyOpts = (target) => ({
  target,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error(`Proxy error to ${target}:`, err.message);
      res.status(502).json({ error: 'Service temporarily unavailable' });
    }
  }
});

// Auth routes (rate limited)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/otp', otpLimiter);
app.use('/api/auth', createProxyMiddleware(proxyOpts(process.env.USER_SERVICE_URL)));
app.use('/api/users', createProxyMiddleware(proxyOpts(process.env.USER_SERVICE_URL)));

app.use('/api/extinguishers', createProxyMiddleware(proxyOpts(process.env.EQUIPMENT_SERVICE_URL)));
app.use('/api/inspections', createProxyMiddleware(proxyOpts(process.env.INSPECTION_SERVICE_URL)));
app.use('/api/maintenance', createProxyMiddleware(proxyOpts(process.env.INSPECTION_SERVICE_URL)));
app.use('/api/reports', createProxyMiddleware(proxyOpts(process.env.REPORT_SERVICE_URL)));
app.use('/api/notifications', createProxyMiddleware(proxyOpts(process.env.NOTIFICATION_SERVICE_URL)));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(3000, () => console.log('API Gateway running on :3000'));
```

---

## 👤 User Service — `services/user-service/`

### `package.json`
```json
{
  "name": "user-service",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": { "start": "node src/index.js", "dev": "nodemon src/index.js" },
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.35.0",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "ioredis": "^5.3.2",
    "axios": "^1.6.0",
    "morgan": "^1.10.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "crypto": "^1.0.1",
    "nodemailer": "^6.9.7"
  }
}
```

### `src/index.js`
```javascript
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

sequelize.sync({ alter: process.env.NODE_ENV !== 'production' }).then(() => {
  app.listen(3001, () => console.log('User Service on :3001'));
}).catch(err => { console.error('DB sync failed:', err); process.exit(1); });
```

### `src/models/index.js`
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  }
);

const User = require('./user.model')(sequelize);
const AuditLog = require('./audit-log.model')(sequelize);
const RefreshToken = require('./refresh-token.model')(sequelize);

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });

module.exports = { sequelize, User, AuditLog, RefreshToken };
```

### `src/models/user.model.js`
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName: { type: DataTypes.STRING(50), allowNull: false,
    validate: { notEmpty: true, len: [2, 50] } },
  lastName: { type: DataTypes.STRING(50), allowNull: false,
    validate: { notEmpty: true, len: [2, 50] } },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true,
    validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'inspector', 'user'), defaultValue: 'user' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: true },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  phone: { type: DataTypes.STRING(20) },
  department: { type: DataTypes.STRING(100) },
  lastLoginAt: { type: DataTypes.DATE },
  passwordChangedAt: { type: DataTypes.DATE },
  profileImage: { type: DataTypes.STRING(500) },
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [{ unique: true, fields: ['email'] }]
});
```

### `src/models/refresh-token.model.js`
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('RefreshToken', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  token: { type: DataTypes.TEXT, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  isRevoked: { type: DataTypes.BOOLEAN, defaultValue: false },
  userAgent: { type: DataTypes.STRING(500) },
  ipAddress: { type: DataTypes.STRING(45) },
}, { tableName: 'refresh_tokens', timestamps: true });
```

### `src/models/audit-log.model.js`
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  action: { type: DataTypes.STRING(100), allowNull: false },
  resource: { type: DataTypes.STRING(100) },
  resourceId: { type: DataTypes.STRING(100) },
  oldValues: { type: DataTypes.JSONB },
  newValues: { type: DataTypes.JSONB },
  ipAddress: { type: DataTypes.STRING(45) },
  userAgent: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.ENUM('success', 'failure'), defaultValue: 'success' },
}, { tableName: 'audit_logs', timestamps: true, updatedAt: false });
```

### `src/utils/jwt.js`
```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateTokens = (user) => {
  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(
    { sub: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const verifyAccess = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefresh = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = { generateTokens, verifyAccess, verifyRefresh };
```

### `src/utils/otp.js`
```javascript
const crypto = require('crypto');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const OTP_TTL = 600; // 10 minutes

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const storeOTP = async (userId, purpose) => {
  const otp = generateOTP();
  const key = `otp:${purpose}:${userId}`;
  await redis.setex(key, OTP_TTL, otp);
  return otp;
};

const verifyOTP = async (userId, purpose, submittedOtp) => {
  const key = `otp:${purpose}:${userId}`;
  const stored = await redis.get(key);
  if (!stored) return { valid: false, reason: 'OTP expired or not found' };
  if (stored !== submittedOtp) return { valid: false, reason: 'Invalid OTP' };
  await redis.del(key);
  return { valid: true };
};

const invalidateOTP = async (userId, purpose) => {
  await redis.del(`otp:${purpose}:${userId}`);
};

module.exports = { generateOTP, storeOTP, verifyOTP, invalidateOTP };
```

### `src/utils/password.js`
```javascript
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

const hashPassword = async (plain) => bcrypt.hash(plain, SALT_ROUNDS);
const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);

const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  return Array.from(crypto.randomBytes(12))
    .map(b => chars[b % chars.length])
    .join('');
};

const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters required');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('At least one special character (!@#$%^&*)');
  return errors;
};

module.exports = { hashPassword, comparePassword, generateTempPassword, validatePasswordStrength };
```

### `src/middleware/auth.middleware.js`
```javascript
const { verifyAccess } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = verifyAccess(authHeader.split(' ')[1]);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, authorize };
```

### `src/controllers/auth.controller.js`
```javascript
const axios = require('axios');
const { User, RefreshToken, AuditLog } = require('../models');
const { generateTokens, verifyRefresh } = require('../utils/jwt');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { storeOTP, verifyOTP } = require('../utils/otp');
const { Op } = require('sequelize');

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL;

const sendNotification = async (type, payload) => {
  try {
    await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, { type, payload });
  } catch (e) {
    console.error('Notification send failed:', e.message);
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    await AuditLog.create({ userId: user.id, action: 'LOGIN_FAILED', status: 'failure',
      ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate OTP and send via email
  const otp = await storeOTP(user.id, 'login');
  await sendNotification('otp', {
    email: user.email,
    name: user.firstName,
    otp,
    purpose: 'login verification'
  });

  res.json({
    message: 'OTP sent to your email',
    userId: user.id,
    mustChangePassword: user.mustChangePassword,
    requiresOtp: true
  });
};

// POST /api/auth/verify-otp
exports.verifyLoginOtp = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) return res.status(400).json({ error: 'userId and otp required' });

  const result = await verifyOTP(userId, 'login', otp);
  if (!result.valid) return res.status(401).json({ error: result.reason });

  const user = await User.findByPk(userId);
  if (!user || !user.isActive) return res.status(404).json({ error: 'User not found' });

  const { accessToken, refreshToken } = generateTokens(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user.id, token: refreshToken, expiresAt,
    userAgent: req.headers['user-agent'], ipAddress: req.ip
  });

  await user.update({ lastLoginAt: new Date() });

  await AuditLog.create({ userId: user.id, action: 'LOGIN_SUCCESS', status: 'success',
    ipAddress: req.ip, userAgent: req.headers['user-agent'] });

  res.json({
    accessToken, refreshToken,
    mustChangePassword: user.mustChangePassword,
    user: {
      id: user.id, firstName: user.firstName, lastName: user.lastName,
      email: user.email, role: user.role
    }
  });
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  let decoded;
  try { decoded = verifyRefresh(refreshToken); }
  catch (e) { return res.status(401).json({ error: 'Invalid or expired refresh token' }); }

  const tokenRecord = await RefreshToken.findOne({
    where: { token: refreshToken, userId: decoded.sub, isRevoked: false }
  });
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Refresh token expired or revoked' });
  }

  const user = await User.findByPk(decoded.sub);
  if (!user || !user.isActive) return res.status(401).json({ error: 'User inactive' });

  await tokenRecord.update({ isRevoked: true });
  const tokens = generateTokens(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId: user.id, token: tokens.refreshToken, expiresAt });

  res.json(tokens);
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.update({ isRevoked: true }, { where: { token: refreshToken } });
  }
  await AuditLog.create({ userId: req.user?.sub, action: 'LOGOUT', status: 'success',
    ipAddress: req.ip });
  res.json({ message: 'Logged out successfully' });
};

// POST /api/auth/change-password  (required on first login)
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.sub);

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

  const errors = validatePasswordStrength(newPassword);
  if (errors.length) return res.status(400).json({ error: 'Weak password', details: errors });

  const hashed = await hashPassword(newPassword);
  await user.update({ password: hashed, mustChangePassword: false, passwordChangedAt: new Date() });
  await AuditLog.create({ userId: user.id, action: 'PASSWORD_CHANGED', status: 'success' });

  res.json({ message: 'Password changed successfully' });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email: email?.toLowerCase() } });

  // Always return 200 to prevent email enumeration
  if (user && user.isActive) {
    const otp = await storeOTP(user.id, 'reset');
    await sendNotification('password_reset', {
      email: user.email, name: user.firstName, otp
    });
  }
  res.json({ message: 'If that email exists, a reset OTP has been sent' });
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ where: { email: email?.toLowerCase() } });
  if (!user) return res.status(400).json({ error: 'Invalid request' });

  const result = await verifyOTP(user.id, 'reset', otp);
  if (!result.valid) return res.status(400).json({ error: result.reason });

  const errors = validatePasswordStrength(newPassword);
  if (errors.length) return res.status(400).json({ error: 'Weak password', details: errors });

  const hashed = await hashPassword(newPassword);
  await user.update({ password: hashed, mustChangePassword: false, passwordChangedAt: new Date() });
  await RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });

  res.json({ message: 'Password reset successfully. Please log in.' });
};
```

### `src/controllers/user.controller.js`
```javascript
const { User, AuditLog } = require('../models');
const { hashPassword, generateTempPassword } = require('../utils/password');
const axios = require('axios');
const { Op } = require('sequelize');

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL;

const sanitizeUser = (user) => {
  const { password, ...safe } = user.toJSON();
  return safe;
};

// POST /api/users  (Admin only — creates user with temp password)
exports.createUser = async (req, res) => {
  const { firstName, lastName, email, role, phone, department } = req.body;

  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const tempPassword = generateTempPassword();
  const hashed = await hashPassword(tempPassword);

  const user = await User.create({
    firstName, lastName,
    email: email.toLowerCase(),
    password: hashed,
    role: role || 'user',
    phone, department,
    mustChangePassword: true,
    isEmailVerified: false
  });

  // Send welcome email with temp password
  try {
    await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, {
      type: 'welcome',
      payload: {
        email: user.email,
        name: user.firstName,
        tempPassword,
        role: user.role
      }
    });
  } catch (e) {
    console.error('Welcome email failed:', e.message);
  }

  await AuditLog.create({
    userId: req.user.sub, action: 'USER_CREATED',
    resource: 'users', resourceId: user.id,
    newValues: { email: user.email, role: user.role }
  });

  res.status(201).json({ message: 'User created. Temporary password sent to email.', user: sanitizeUser(user) });
};

// GET /api/users  (Admin only, paginated)
exports.listUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { role, isActive, search } = req.query;

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    limit, offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) }
  });
};

// GET /api/users/:id
exports.getUser = async (req, res) => {
  const where = req.params.id === 'me' ? { id: req.user.sub } : { id: req.params.id };
  if (req.params.id !== 'me' && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const user = await User.findOne({ where, attributes: { exclude: ['password'] } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

// PATCH /api/users/:id
exports.updateUser = async (req, res) => {
  const targetId = req.params.id === 'me' ? req.user.sub : req.params.id;
  if (targetId !== req.user.sub && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const user = await User.findByPk(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const allowed = ['firstName', 'lastName', 'phone', 'department', 'profileImage'];
  if (req.user.role === 'admin') allowed.push('role', 'isActive');

  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const old = user.toJSON();
  await user.update(updates);

  await AuditLog.create({
    userId: req.user.sub, action: 'USER_UPDATED',
    resource: 'users', resourceId: targetId,
    oldValues: old, newValues: updates
  });

  res.json(sanitizeUser(user));
};

// DELETE /api/users/:id (Admin — soft delete)
exports.deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.id === req.user.sub) return res.status(400).json({ error: 'Cannot deactivate yourself' });

  await user.update({ isActive: false });
  await AuditLog.create({ userId: req.user.sub, action: 'USER_DEACTIVATED',
    resource: 'users', resourceId: user.id });

  res.json({ message: 'User deactivated successfully' });
};

// GET /api/users/audit-logs
exports.getAuditLogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    limit, offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
  });

  res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
};
```

### `src/routes/auth.routes.js`
```javascript
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], validate, ctrl.login);

router.post('/verify-otp', [
  body('userId').isUUID(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], validate, ctrl.verifyLoginOtp);

router.post('/refresh', ctrl.refreshToken);
router.post('/logout', authenticate, ctrl.logout);
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], validate, ctrl.changePassword);
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], validate, ctrl.forgotPassword);
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  body('newPassword').isLength({ min: 8 })
], validate, ctrl.resetPassword);

module.exports = router;
```

### `src/routes/user.routes.js`
```javascript
const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.use(authenticate);

router.post('/', authorize('admin'), [
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'inspector', 'user'])
], validate, ctrl.createUser);

router.get('/', authorize('admin'), ctrl.listUsers);
router.get('/audit-logs', authorize('admin'), ctrl.getAuditLogs);
router.get('/me', ctrl.getUser);
router.get('/:id', authorize('admin'), ctrl.getUser);
router.patch('/me', ctrl.updateUser);
router.patch('/:id', ctrl.updateUser);
router.delete('/:id', authorize('admin'), ctrl.deleteUser);

module.exports = router;
```

---

## 🧯 Equipment Service — `services/equipment-service/`

### `src/models/extinguisher.model.js`
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Extinguisher', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  serialNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  location: { type: DataTypes.STRING(200), allowNull: false },
  building: { type: DataTypes.STRING(100) },
  floor: { type: DataTypes.STRING(20) },
  room: { type: DataTypes.STRING(50) },
  type: {
    type: DataTypes.ENUM('water', 'co2', 'foam', 'dry_chemical', 'wet_chemical', 'halon'),
    allowNull: false
  },
  size: {
    type: DataTypes.ENUM('2.5lbs', '5lbs', '9lbs', '12lbs', '20lbs'),
    allowNull: false
  },
  manufacturer: { type: DataTypes.STRING(100) },
  model: { type: DataTypes.STRING(100) },
  installationDate: { type: DataTypes.DATEONLY, allowNull: false },
  expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
  lastInspectionDate: { type: DataTypes.DATEONLY },
  nextInspectionDate: { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'maintenance', 'decommissioned', 'missing'),
    defaultValue: 'active'
  },
  pressure: { type: DataTypes.STRING(20) },
  notes: { type: DataTypes.TEXT },
  qrCode: { type: DataTypes.STRING(500) },
  createdBy: { type: DataTypes.UUID },
}, {
  tableName: 'extinguishers',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['serialNumber'] },
    { fields: ['status'] },
    { fields: ['expiryDate'] },
    { fields: ['location'] }
  ]
});
```

### `src/controllers/extinguisher.controller.js`
```javascript
const { Extinguisher } = require('../models');
const { Op } = require('sequelize');

// POST /api/extinguishers
exports.create = async (req, res) => {
  const {
    serialNumber, location, building, floor, room,
    type, size, manufacturer, model,
    installationDate, expiryDate, notes, pressure
  } = req.body;

  const exists = await Extinguisher.findOne({ where: { serialNumber } });
  if (exists) return res.status(409).json({ error: 'Serial number already registered' });

  // Auto-calculate next inspection (1 year after install)
  const nextInspectionDate = new Date(installationDate);
  nextInspectionDate.setFullYear(nextInspectionDate.getFullYear() + 1);

  const ext = await Extinguisher.create({
    serialNumber, location, building, floor, room,
    type, size, manufacturer, model,
    installationDate, expiryDate,
    nextInspectionDate: nextInspectionDate.toISOString().split('T')[0],
    notes, pressure,
    createdBy: req.user.sub
  });

  res.status(201).json(ext);
};

// GET /api/extinguishers
exports.list = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { status, type, location, search, expiringSoon } = req.query;

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (location) where.location = { [Op.iLike]: `%${location}%` };

  if (expiringSoon === 'true') {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    where.expiryDate = { [Op.lte]: thirtyDays.toISOString().split('T')[0] };
  }

  if (search) {
    where[Op.or] = [
      { serialNumber: { [Op.iLike]: `%${search}%` } },
      { location: { [Op.iLike]: `%${search}%` } },
      { building: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Auto-update status for expired
  const today = new Date().toISOString().split('T')[0];
  await Extinguisher.update(
    { status: 'expired' },
    { where: { expiryDate: { [Op.lt]: today }, status: 'active' } }
  );

  const { count, rows } = await Extinguisher.findAndCountAll({
    where, limit, offset, order: [['createdAt', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) }
  });
};

// GET /api/extinguishers/:id
exports.getById = async (req, res) => {
  const ext = await Extinguisher.findByPk(req.params.id);
  if (!ext) return res.status(404).json({ error: 'Extinguisher not found' });
  res.json(ext);
};

// PATCH /api/extinguishers/:id
exports.update = async (req, res) => {
  const ext = await Extinguisher.findByPk(req.params.id);
  if (!ext) return res.status(404).json({ error: 'Extinguisher not found' });

  const allowed = [
    'location', 'building', 'floor', 'room',
    'status', 'pressure', 'notes',
    'lastInspectionDate', 'nextInspectionDate',
    'expiryDate', 'type', 'size'
  ];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  await ext.update(updates);
  res.json(ext);
};

// DELETE /api/extinguishers/:id  (Admin only — hard delete or decommission)
exports.remove = async (req, res) => {
  const ext = await Extinguisher.findByPk(req.params.id);
  if (!ext) return res.status(404).json({ error: 'Extinguisher not found' });

  if (req.query.hard === 'true' && req.user.role === 'admin') {
    await ext.destroy();
    return res.json({ message: 'Extinguisher permanently deleted' });
  }

  await ext.update({ status: 'decommissioned' });
  res.json({ message: 'Extinguisher decommissioned' });
};

// GET /api/extinguishers/stats/summary
exports.summary = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const [total, active, expired, maintenance, expiringSoon, byType] = await Promise.all([
    Extinguisher.count(),
    Extinguisher.count({ where: { status: 'active' } }),
    Extinguisher.count({ where: { status: 'expired' } }),
    Extinguisher.count({ where: { status: 'maintenance' } }),
    Extinguisher.count({ where: {
      expiryDate: { [Op.between]: [today, thirtyDays.toISOString().split('T')[0]] },
      status: 'active'
    }}),
    Extinguisher.findAll({
      attributes: ['type', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['type'], raw: true
    })
  ]);

  res.json({ total, active, expired, maintenance, expiringSoon, byType });
};
```

### `src/routes/extinguisher.routes.js`
```javascript
const router = require('express').Router();
const ctrl = require('../controllers/extinguisher.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(422).json({ errors: e.array() });
  next();
};

router.use(authenticate);

router.get('/stats/summary', ctrl.summary);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

router.post('/', authorize('admin', 'inspector'), [
  body('serialNumber').trim().notEmpty(),
  body('location').trim().notEmpty(),
  body('type').isIn(['water', 'co2', 'foam', 'dry_chemical', 'wet_chemical', 'halon']),
  body('size').isIn(['2.5lbs', '5lbs', '9lbs', '12lbs', '20lbs']),
  body('installationDate').isDate(),
  body('expiryDate').isDate()
], validate, ctrl.create);

router.patch('/:id', authorize('admin', 'inspector'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
```

---

## 🔍 Inspection Service — `services/inspection-service/`

### `src/models/inspection.model.js`
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Inspection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  extinguisherId: { type: DataTypes.UUID, allowNull: false },
  scheduledBy: { type: DataTypes.UUID, allowNull: false },
  assignedInspector: { type: DataTypes.UUID },
  scheduledDate: { type: DataTypes.DATE, allowNull: false },
  completedDate: { type: DataTypes.DATE },
  status: {
    type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'missed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  type: {
    type: DataTypes.ENUM('routine', 'annual', 'emergency', 'post_maintenance', 'compliance'),
    defaultValue: 'routine'
  },
  result: {
    type: DataTypes.ENUM('passed', 'failed', 'needs_maintenance', 'decommissioned')
  },
  findings: { type: DataTypes.TEXT },
  notes: { type: DataTypes.TEXT },
  nextInspectionDate: { type: DataTypes.DATEONLY },
  notifiedAt: { type: DataTypes.DATE },
}, { tableName: 'inspections', timestamps: true, indexes: [
  { fields: ['extinguisherId'] }, { fields: ['scheduledDate'] }, { fields: ['status'] }
]});
```

### `src/models/maintenance-log.model.js`
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('MaintenanceLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  extinguisherId: { type: DataTypes.UUID, allowNull: false },
  inspectionId: { type: DataTypes.UUID },
  performedBy: { type: DataTypes.UUID, allowNull: false },
  actionDate: { type: DataTypes.DATEONLY, allowNull: false },
  actionsTaken: { type: DataTypes.TEXT, allowNull: false },
  conditionsNoted: { type: DataTypes.TEXT },
  partsReplaced: { type: DataTypes.JSONB, defaultValue: [] },
  cost: { type: DataTypes.DECIMAL(10, 2) },
  nextServiceDate: { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.ENUM('completed', 'pending_parts', 'decommissioned'),
    defaultValue: 'completed'
  },
  attachments: { type: DataTypes.JSONB, defaultValue: [] },
}, { tableName: 'maintenance_logs', timestamps: true });
```

### `src/controllers/inspection.controller.js`
```javascript
const { Inspection, MaintenanceLog } = require('../models');
const axios = require('axios');
const { Op } = require('sequelize');

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL;
const EQUIPMENT_URL = process.env.EQUIPMENT_SERVICE_URL;

// POST /api/inspections  — Schedule inspection
exports.schedule = async (req, res) => {
  const { extinguisherId, scheduledDate, type, assignedInspector, notes } = req.body;

  // Verify extinguisher exists
  try {
    await axios.get(`${EQUIPMENT_URL}/api/extinguishers/${extinguisherId}`,
      { headers: { Authorization: req.headers.authorization } });
  } catch (e) {
    return res.status(404).json({ error: 'Extinguisher not found' });
  }

  const inspection = await Inspection.create({
    extinguisherId, scheduledDate, type: type || 'routine',
    assignedInspector, notes, scheduledBy: req.user.sub
  });

  // Notify inspector
  if (assignedInspector) {
    try {
      await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, {
        type: 'inspection_scheduled',
        payload: {
          inspectorId: assignedInspector,
          inspectionId: inspection.id,
          scheduledDate,
          extinguisherId
        }
      });
      await inspection.update({ notifiedAt: new Date() });
    } catch (e) {
      console.error('Notification failed:', e.message);
    }
  }

  res.status(201).json(inspection);
};

// GET /api/inspections
exports.list = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { status, type, extinguisherId, from, to } = req.query;

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (extinguisherId) where.extinguisherId = extinguisherId;
  if (req.user.role === 'inspector') where.assignedInspector = req.user.sub;
  if (from || to) {
    where.scheduledDate = {};
    if (from) where.scheduledDate[Op.gte] = new Date(from);
    if (to) where.scheduledDate[Op.lte] = new Date(to);
  }

  const { count, rows } = await Inspection.findAndCountAll({
    where, limit, offset, order: [['scheduledDate', 'ASC']]
  });

  res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
};

// GET /api/inspections/:id
exports.getById = async (req, res) => {
  const inspection = await Inspection.findByPk(req.params.id, {
    include: [{ model: MaintenanceLog, as: 'maintenanceLogs' }]
  });
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' });
  res.json(inspection);
};

// PATCH /api/inspections/:id — Inspector logs result
exports.update = async (req, res) => {
  const inspection = await Inspection.findByPk(req.params.id);
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' });

  if (req.user.role === 'inspector' && inspection.assignedInspector !== req.user.sub) {
    return res.status(403).json({ error: 'Not your assigned inspection' });
  }

  const { status, result, findings, notes, completedDate, nextInspectionDate } = req.body;
  await inspection.update({
    status, result, findings, notes,
    completedDate: completedDate || (status === 'completed' ? new Date() : undefined),
    nextInspectionDate
  });

  // Update extinguisher last inspection date
  if (status === 'completed') {
    try {
      await axios.patch(
        `${EQUIPMENT_URL}/api/extinguishers/${inspection.extinguisherId}`,
        { lastInspectionDate: new Date().toISOString().split('T')[0], nextInspectionDate },
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (e) {
      console.error('Equipment update failed:', e.message);
    }
  }

  res.json(inspection);
};

// POST /api/maintenance — Log maintenance activity
exports.logMaintenance = async (req, res) => {
  const { extinguisherId, inspectionId, actionDate, actionsTaken, conditionsNoted,
    partsReplaced, cost, nextServiceDate, status } = req.body;

  const log = await MaintenanceLog.create({
    extinguisherId, inspectionId,
    performedBy: req.user.sub,
    actionDate, actionsTaken, conditionsNoted,
    partsReplaced: partsReplaced || [],
    cost, nextServiceDate,
    status: status || 'completed'
  });

  // Update extinguisher status if needed
  if (status === 'decommissioned') {
    try {
      await axios.patch(
        `${EQUIPMENT_URL}/api/extinguishers/${extinguisherId}`,
        { status: 'decommissioned' },
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (e) {}
  }

  res.status(201).json(log);
};

// GET /api/maintenance
exports.listMaintenance = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const { extinguisherId, from, to } = req.query;

  const where = {};
  if (extinguisherId) where.extinguisherId = extinguisherId;
  if (from || to) {
    where.actionDate = {};
    if (from) where.actionDate[Op.gte] = from;
    if (to) where.actionDate[Op.lte] = to;
  }

  const { count, rows } = await MaintenanceLog.findAndCountAll({
    where, limit, offset, order: [['actionDate', 'DESC']]
  });

  res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
};
```

---

## 📊 Report Service — `services/report-service/`

### `src/controllers/report.controller.js`
```javascript
const axios = require('axios');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

const EQUIPMENT_URL = process.env.EQUIPMENT_SERVICE_URL;
const INSPECTION_URL = process.env.INSPECTION_SERVICE_URL;

const fetchAll = async (url, token) => {
  const res = await axios.get(url, {
    headers: { Authorization: token },
    params: { limit: 1000, page: 1 }
  });
  return res.data;
};

// GET /api/reports/dashboard — Real-time summary
exports.dashboard = async (req, res) => {
  const token = req.headers.authorization;

  const [extStats, inspections, maintenance] = await Promise.all([
    axios.get(`${EQUIPMENT_URL}/api/extinguishers/stats/summary`, { headers: { Authorization: token } }),
    fetchAll(`${INSPECTION_URL}/api/inspections`, token),
    fetchAll(`${INSPECTION_URL}/api/maintenance`, token),
  ]);

  const inspData = inspections.data || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  res.json({
    extinguishers: extStats.data,
    inspections: {
      total: inspData.length,
      scheduled: inspData.filter(i => i.status === 'scheduled').length,
      completed: inspData.filter(i => i.status === 'completed').length,
      missed: inspData.filter(i => i.status === 'missed').length,
      thisMonth: inspData.filter(i => new Date(i.scheduledDate) >= monthStart).length,
      thisYear: inspData.filter(i => new Date(i.scheduledDate) >= yearStart).length,
    },
    maintenance: {
      total: (maintenance.data || []).length,
      thisMonth: (maintenance.data || []).filter(m => new Date(m.actionDate) >= monthStart).length,
    },
    generatedAt: new Date().toISOString()
  });
};

// GET /api/reports/export?format=pdf|csv&type=extinguishers|inspections|maintenance
exports.export = async (req, res) => {
  const { format = 'pdf', type = 'extinguishers' } = req.query;
  const token = req.headers.authorization;

  let data = [];
  let title = '';

  if (type === 'extinguishers') {
    const r = await fetchAll(`${EQUIPMENT_URL}/api/extinguishers`, token);
    data = r.data || [];
    title = 'Fire Extinguishers Report';
  } else if (type === 'inspections') {
    const r = await fetchAll(`${INSPECTION_URL}/api/inspections`, token);
    data = r.data || [];
    title = 'Inspections Report';
  } else if (type === 'maintenance') {
    const r = await fetchAll(`${INSPECTION_URL}/api/maintenance`, token);
    data = r.data || [];
    title = 'Maintenance History Report';
  } else {
    return res.status(400).json({ error: 'Invalid report type' });
  }

  if (format === 'csv') {
    const parser = new Parser();
    const csv = parser.parse(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${Date.now()}.csv"`);
    return res.send(csv);
  }

  // PDF generation
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 60).fill('#1a1a2e');
  doc.fillColor('white').fontSize(18).text('TWZ LTD — Fire Safety Management', 40, 15);
  doc.fontSize(11).text(title, 40, 38);
  doc.fillColor('#666').fontSize(9).text(`Generated: ${new Date().toLocaleString()}  |  Records: ${data.length}`,
    doc.page.width - 280, 42);

  doc.moveDown(3);
  doc.fillColor('#333').fontSize(10);

  if (data.length === 0) {
    doc.text('No records found for this report.', 40, 80);
  } else {
    const fields = Object.keys(data[0]).filter(k => !['id', 'createdBy', 'updatedAt'].includes(k));
    const colWidth = (doc.page.width - 80) / Math.min(fields.length, 8);
    const displayFields = fields.slice(0, 8);

    // Table header
    let y = 80;
    doc.rect(40, y, doc.page.width - 80, 20).fill('#e8e8e8');
    doc.fillColor('#333').fontSize(8);
    displayFields.forEach((f, i) => {
      doc.text(f.replace(/([A-Z])/g, ' $1').trim(), 42 + i * colWidth, y + 6, { width: colWidth - 4 });
    });

    y += 22;
    doc.fontSize(7).fillColor('#444');

    data.slice(0, 50).forEach((row, ri) => {
      if (y > doc.page.height - 60) {
        doc.addPage({ layout: 'landscape', margin: 40 });
        y = 40;
      }
      if (ri % 2 === 0) doc.rect(40, y, doc.page.width - 80, 16).fill('#f9f9f9');
      doc.fillColor('#333');
      displayFields.forEach((f, i) => {
        const val = String(row[f] ?? '').substring(0, 25);
        doc.text(val, 42 + i * colWidth, y + 4, { width: colWidth - 4 });
      });
      y += 18;
    });

    if (data.length > 50) {
      doc.moveDown().fillColor('#999').fontSize(9)
        .text(`... and ${data.length - 50} more records. Export as CSV for full dataset.`, 40);
    }
  }

  doc.end();
};
```

---

## 📧 Notification Service — `services/notification-service/src/index.js`

```javascript
const express = require('express');
const nodemailer = require('nodemailer');
const Redis = require('ioredis');

const app = express();
app.use(express.json({ limit: '10kb' }));

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' }
});

const templates = {
  welcome: ({ name, tempPassword, email, role }) => ({
    subject: 'Welcome to TWZ Fire Safety System',
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:30px;border-radius:8px">
      <div style="background:#1a1a2e;color:white;padding:20px;border-radius:6px;margin-bottom:20px">
        <h2 style="margin:0">🔥 TWZ Fire Safety Management</h2>
      </div>
      <h3>Welcome, ${name}!</h3>
      <p>Your account has been created with the role of <strong>${role}</strong>.</p>
      <div style="background:#fff3cd;border:1px solid #ffc107;padding:15px;border-radius:4px;margin:15px 0">
        <strong>Your Temporary Password:</strong>
        <p style="font-size:18px;font-family:monospace;letter-spacing:2px;background:#f8f9fa;padding:10px;border-radius:4px">${tempPassword}</p>
      </div>
      <p>⚠️ You <strong>must change this password</strong> immediately upon first login.</p>
      <p>Login at: <a href="${process.env.FRONTEND_URL || 'http://localhost'}">${process.env.FRONTEND_URL || 'http://localhost'}</a></p>
      <hr/><p style="color:#999;font-size:12px">This is an automated message from TWZ Fire Safety System.</p>
    </div>`
  }),

  otp: ({ name, otp, purpose }) => ({
    subject: `Your OTP Code — ${otp}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px">
      <h3>Hello ${name},</h3>
      <p>Your OTP for <strong>${purpose}</strong>:</p>
      <div style="background:#1a1a2e;color:white;text-align:center;padding:20px;border-radius:8px;margin:20px 0">
        <span style="font-size:36px;font-family:monospace;letter-spacing:8px;font-weight:bold">${otp}</span>
      </div>
      <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    </div>`
  }),

  password_reset: ({ name, otp }) => ({
    subject: 'Password Reset OTP',
    html: `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px">
      <h3>Password Reset Request</h3>
      <p>Hello ${name}, use this OTP to reset your password:</p>
      <div style="background:#dc3545;color:white;text-align:center;padding:20px;border-radius:8px;margin:20px 0">
        <span style="font-size:36px;font-family:monospace;letter-spacing:8px;font-weight:bold">${otp}</span>
      </div>
      <p>Expires in 10 minutes. If you did not request this, ignore this email.</p>
    </div>`
  }),

  inspection_scheduled: ({ scheduledDate, extinguisherId }) => ({
    subject: 'Inspection Scheduled — TWZ Fire System',
    html: `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px">
      <h3>Inspection Assigned</h3>
      <p>An inspection has been scheduled for you:</p>
      <ul>
        <li><strong>Date:</strong> ${new Date(scheduledDate).toLocaleString()}</li>
        <li><strong>Extinguisher ID:</strong> ${extinguisherId}</li>
      </ul>
      <p>Please log in to view full details.</p>
    </div>`
  })
};

// POST /api/notifications/send
app.post('/api/notifications/send', async (req, res) => {
  const { type, payload } = req.body;
  const template = templates[type];
  if (!template) return res.status(400).json({ error: 'Unknown notification type' });

  const { subject, html } = template(payload);
  const toEmail = payload.email;

  if (!toEmail) return res.status(400).json({ error: 'Email address required' });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'TWZ Fire Safety <noreply@twzltd.com>',
      to: toEmail,
      subject,
      html
    });
    console.log(`Email sent: ${type} → ${toEmail}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3005, () => console.log('Notification Service on :3005'));
```
