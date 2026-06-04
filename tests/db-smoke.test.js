/**
 * Database smoke tests — no HTTP services required (PostgreSQL only).
 * node --test tests/db-smoke.test.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const dotenv = require(path.join(__dirname, "../services/user-service/node_modules/dotenv"));

describe("Database seed data", () => {
  it("users exist with Rwandan test emails", async () => {
    dotenv.config({ path: path.join(__dirname, "../services/user-service/.env") });
    const { sequelize, User } = require("../services/user-service/src/models");
    await sequelize.authenticate();
    const emails = ["benmu91@gmail.com", "cabledie@gmail.com", "devroom210@gmail.com"];
    const roles = {
      "benmu91@gmail.com": "admin",
      "cabledie@gmail.com": "inspector",
      "devroom210@gmail.com": "user",
    };
    for (const email of emails) {
      const u = await User.findOne({ where: { email } });
      assert.ok(u, `missing user ${email}`);
      assert.equal(u.role, roles[email], `${email} role`);
      assert.ok(u.phone?.startsWith("+250"), `${email} needs Rwanda phone`);
      assert.equal(u.isEmailVerified, true);
    }
    await sequelize.close();
  });

  it("extinguishers seeded", async () => {
    dotenv.config({ path: path.join(__dirname, "../services/equipment-service/.env") });
    const { sequelize, Extinguisher } = require("../services/equipment-service/src/models");
    await sequelize.authenticate();
    const count = await Extinguisher.count();
    assert.ok(count >= 5, "expected at least 5 extinguishers");
    await sequelize.close();
  });

  it("inspections and maintenance seeded", async () => {
    dotenv.config({ path: path.join(__dirname, "../services/inspection-service/.env") });
    const { sequelize, Inspection, MaintenanceLog } = require(
      "../services/inspection-service/src/models"
    );
    await sequelize.authenticate();
    assert.ok((await Inspection.count()) >= 1);
    assert.ok((await MaintenanceLog.count()) >= 1);
    await sequelize.close();
  });
});
