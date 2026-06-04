/**
 * Seeds demo data across users_db, equipment_db, inspections_db.
 * Sends welcome emails to test accounts via notification-service.
 *
 * Usage: node scripts/seed-all.js
 * Password for all seeded accounts: Test@1234!
 */
const path = require("path");
const userModules = path.join(__dirname, "../services/user-service/node_modules");
const axios = require(path.join(userModules, "axios"));
const dotenv = require(path.join(userModules, "dotenv"));

dotenv.config({ path: path.join(__dirname, "../.env") });

const DEMO_PASSWORD = "Test@1234!";
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3005";

const ADMIN_EMAIL = "benmu91@gmail.com";

const TEST_USERS = [
  {
    firstName: "Marie Chantal",
    lastName: "Mukamazimpaka",
    email: "cabledie@gmail.com",
    role: "inspector",
    phone: "+250789222002",
    department: "Field Inspections — Kigali",
  },
  {
    firstName: "Patrick",
    lastName: "Niyonsenga",
    email: "devroom210@gmail.com",
    role: "user",
    phone: "+250787333003",
    department: "Facilities — Gasabo",
  },
];

const EXTINGUISHERS = [
  {
    serialNumber: "TWZ-KGL-001",
    location: "Kigali City Tower — Ground Floor",
    building: "Kigali City Tower",
    floor: "G",
    room: "Lobby",
    type: "co2",
    size: "5lbs",
    manufacturer: "Amerex",
    model: "B500",
    installationDate: "2023-01-15",
    expiryDate: "2026-01-15",
    pressure: "195 PSI",
    status: "active",
  },
  {
    serialNumber: "TWZ-KGL-002",
    location: "CHIC Building — Server Room",
    building: "CHIC Building",
    floor: "2",
    room: "Server Room",
    type: "dry_chemical",
    size: "9lbs",
    manufacturer: "Kidde",
    model: "ProLine",
    installationDate: "2022-06-01",
    expiryDate: "2025-06-01",
    pressure: "180 PSI",
    status: "active",
  },
  {
    serialNumber: "TWZ-KGL-003",
    location: "Kigali Convention Centre — Hall A",
    building: "KCC",
    floor: "1",
    room: "Hall A",
    type: "foam",
    size: "12lbs",
    manufacturer: "Ansul",
    model: "A411",
    installationDate: "2021-03-20",
    expiryDate: "2024-03-20",
    pressure: "175 PSI",
    status: "expired",
  },
  {
    serialNumber: "TWZ-KGL-004",
    location: "Remera Industrial Park — Warehouse B",
    building: "Warehouse B",
    floor: "1",
    room: "Loading Bay",
    type: "water",
    size: "2.5lbs",
    manufacturer: "Badger",
    model: "W250",
    installationDate: "2024-02-10",
    expiryDate: "2027-02-10",
    pressure: "200 PSI",
    status: "active",
  },
  {
    serialNumber: "TWZ-KGL-005",
    location: "Nyarutarama Office Park — Block C",
    building: "Block C",
    floor: "3",
    room: "Corridor",
    type: "co2",
    size: "20lbs",
    manufacturer: "Amerex",
    model: "B456",
    installationDate: "2023-09-01",
    expiryDate: "2026-09-01",
    pressure: "190 PSI",
    status: "maintenance",
  },
];

async function sendWelcome(email, name, role) {
  try {
    await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, {
      type: "welcome",
      payload: {
        email,
        name,
        tempPassword: DEMO_PASSWORD,
        role,
      },
    });
    console.log(`  ✉ Welcome email queued → ${email}`);
  } catch (e) {
    console.warn(`  ⚠ Email failed for ${email}:`, e.message);
  }
}

async function seedUsers() {
  dotenv.config({
    path: path.join(__dirname, "../services/user-service/.env"),
  });
  const { sequelize, User } = require("../services/user-service/src/models");
  const { hashPassword } = require("../services/user-service/src/utils/password");

  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const hashed = await hashPassword(DEMO_PASSWORD);
  const created = {};

  let admin = await User.findOne({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    const legacy = await User.findOne({ where: { email: "admin@twzltd.com" } });
    if (legacy) {
      await legacy.update({
        email: ADMIN_EMAIL,
        firstName: "Ben",
        lastName: "Admin",
        role: "admin",
        mustChangePassword: false,
        isEmailVerified: true,
        isActive: true,
      });
      admin = legacy;
      console.log(`Migrated admin → ${ADMIN_EMAIL}`);
    } else {
      admin = await User.create({
        firstName: "Ben",
        lastName: "Admin",
        email: ADMIN_EMAIL,
        password: hashed,
        role: "admin",
        phone: "+250788000000",
        department: "TWZ HQ — Kigali",
        mustChangePassword: false,
        isEmailVerified: true,
      });
      console.log(`Created admin: ${ADMIN_EMAIL}`);
      await sendWelcome(admin.email, admin.firstName, admin.role);
    }
  } else {
    await admin.update({
      role: "admin",
      mustChangePassword: false,
      isEmailVerified: true,
      isActive: true,
    });
    console.log("Admin exists:", admin.email);
  }
  created.admin = admin;
  created[ADMIN_EMAIL] = admin;

  for (const u of TEST_USERS) {
    let user = await User.findOne({ where: { email: u.email.toLowerCase() } });
    if (!user) {
      user = await User.create({
        ...u,
        email: u.email.toLowerCase(),
        password: hashed,
        mustChangePassword: false,
        isEmailVerified: true,
        isActive: true,
      });
      console.log(`Created user: ${user.email} (${user.role})`);
      await sendWelcome(user.email, user.firstName, user.role);
    } else {
      await user.update({
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        department: u.department,
        role: u.role,
        isEmailVerified: true,
        isActive: true,
      });
      console.log(`Updated user: ${user.email}`);
    }
    created[u.email] = user;
  }

  await sequelize.close();
  return created;
}

async function seedEquipment(createdBy) {
  dotenv.config({
    path: path.join(__dirname, "../services/equipment-service/.env"),
  });
  const { sequelize, Extinguisher } = require("../services/equipment-service/src/models");

  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const ids = [];
  for (const ext of EXTINGUISHERS) {
    let row = await Extinguisher.findOne({ where: { serialNumber: ext.serialNumber } });
    if (!row) {
      const next = new Date(ext.installationDate);
      next.setFullYear(next.getFullYear() + 1);
      row = await Extinguisher.create({
        ...ext,
        nextInspectionDate: next.toISOString().split("T")[0],
        createdBy: createdBy?.id,
      });
      console.log(`Created extinguisher: ${row.serialNumber}`);
    } else {
      await row.update(ext);
      console.log(`Updated extinguisher: ${row.serialNumber}`);
    }
    ids.push(row);
  }

  await sequelize.close();
  return ids;
}

async function seedInspections(users, extinguishers) {
  dotenv.config({
    path: path.join(__dirname, "../services/inspection-service/.env"),
  });
  const { sequelize, Inspection, MaintenanceLog } = require(
    "../services/inspection-service/src/models"
  );

  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const inspector = users["cabledie@gmail.com"];
  const scheduler = users["devroom210@gmail.com"] || users.admin;
  const ext1 = extinguishers[0];
  const ext2 = extinguishers[1];

  if (inspector && ext1) {
    const existing = await Inspection.findOne({
      where: { extinguisherId: ext1.id, status: "scheduled" },
    });
    if (!existing) {
      const insp = await Inspection.create({
        extinguisherId: ext1.id,
        scheduledBy: scheduler.id,
        assignedInspector: null,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: "routine",
        status: "scheduled",
        notes: "Quarterly inspection — Kigali City Tower (awaiting admin assignment)",
      });
      console.log(`Created inspection: ${insp.id}`);
      try {
        await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, {
          type: "inspection_scheduled",
          payload: {
            email: inspector.email,
            scheduledDate: insp.scheduledDate,
            extinguisherId: ext1.id,
            inspectionId: insp.id,
          },
        });
        console.log(`  ✉ Inspection notice → ${inspector.email}`);
      } catch (e) {
        console.warn("  ⚠ Inspection email failed:", e.message);
      }
    }
  }

  if (inspector && ext2) {
    const completed = await Inspection.findOne({
      where: { extinguisherId: ext2.id, status: "completed" },
    });
    if (!completed) {
      const insp = await Inspection.create({
        extinguisherId: ext2.id,
        scheduledBy: scheduler.id,
        assignedInspector: inspector.id,
        scheduledDate: new Date("2025-11-01"),
        completedDate: new Date("2025-11-02"),
        type: "annual",
        status: "completed",
        result: "passed",
        findings: "Pressure gauge in normal range. Seal intact.",
        notes: "CHIC Building server room",
      });

      await MaintenanceLog.create({
        extinguisherId: ext2.id,
        inspectionId: insp.id,
        performedBy: inspector.id,
        actionDate: "2025-11-02",
        actionsTaken: "Replaced pressure gauge seal. Verified discharge hose.",
        conditionsNoted: "Minor dust on unit exterior — cleaned.",
        partsReplaced: ["pressure gauge seal"],
        cost: 45.5,
        status: "completed",
      });
      console.log(`Created completed inspection + maintenance for ${ext2.serialNumber}`);
    }
  }

  await sequelize.close();
}

async function cleanupDemoUsers() {
  const { User } = require("../services/user-service/src/models");
  const { Op } = require(path.join(userModules, "sequelize"));
  const keep = [
    ADMIN_EMAIL.toLowerCase(),
    ...TEST_USERS.map((u) => u.email.toLowerCase()),
  ];
  const stale = await User.findAll({
    where: { isActive: true, email: { [Op.notIn]: keep } },
  });
  for (const u of stale) {
    await u.update({ isActive: false });
    console.log(`Deactivated demo account: ${u.email}`);
  }
  for (const legacy of ["admin@twzltd.com", "ukemuk1@gmail.com"]) {
    const row = await User.findOne({ where: { email: legacy } });
    if (row?.isActive) {
      await row.update({ isActive: false });
      console.log(`Deactivated legacy account: ${row.email}`);
    }
  }
}

async function main() {
  console.log("\n══ TWZ Fire System — Seed Demo Data ══\n");
  const users = await seedUsers();
  console.log("\n── Equipment ──\n");
  const facilityUser = users["devroom210@gmail.com"] || users.admin;
  const extinguishers = await seedEquipment(facilityUser);
  console.log("\n── Inspections & Maintenance ──\n");
  await seedInspections(users, extinguishers);
  await cleanupDemoUsers();
  console.log("\n✔ Seed complete.");
  console.log("\nTest accounts (password: Test@1234!):");
  console.log(`  ${ADMIN_EMAIL} (admin)`);
  TEST_USERS.forEach((u) => console.log(`  ${u.email} (${u.role})`));
  console.log("");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
