require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const morgan  = require('morgan');
const { sequelize } = require('./models');

const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const internalRoutes = require("./routes/internal.routes");
app.use("/api/internal", internalRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/health", (req, res) =>
  res.json({ service: "user-service", status: "ok", port: process.env.PORT || 3001 })
);

app.use((err, req, res, next) => {
  console.error('[user-service]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = parseInt(process.env.PORT, 10) || 3001;

sequelize
  .sync({ alter: process.env.NODE_ENV !== "production" })
  .then(() => app.listen(PORT, () => console.log(`user-service on :${PORT}`)))
  .catch(err => { console.error('DB sync failed:', err); process.exit(1); });