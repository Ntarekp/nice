require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const morgan  = require('morgan');
const { sequelize } = require('./models');

const app = express();
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));

const extinguisherRoutes = require("./routes/extinguisher.routes");
app.use("/api/extinguishers", extinguisherRoutes);

app.get("/health", (req, res) =>
  res.json({ service: "equipment-service", status: "ok", port: process.env.PORT || 3002 })
);

app.use((err, req, res, next) => {
  console.error('[equipment-service]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = parseInt(process.env.PORT, 10) || 3002;

sequelize
  .sync({ alter: process.env.NODE_ENV !== "production" })
  .then(() => app.listen(PORT, () => console.log(`equipment-service on :${PORT}`)))
  .catch(err => { console.error('DB sync failed:', err); process.exit(1); });