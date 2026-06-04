require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const { sequelize, User } = require("../models");
const { hashPassword }    = require("../utils/password");

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync();
  const existing = await User.findOne({ where: { role: "admin" } });
  if (existing) { console.log("Admin already exists:", existing.email); return process.exit(0); }
  const hashed = await hashPassword("Admin@1234!");
  const admin  = await User.create({
    firstName: "System", lastName: "Admin",
    email: "admin@twzltd.com", password: hashed,
    role: "admin", mustChangePassword: true, isEmailVerified: true
  });
  console.log("\n✅ Admin created:", admin.email);
  console.log("🔑 Temp password: Admin@1234!  (CHANGE IMMEDIATELY AFTER FIRST LOGIN)\n");
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });