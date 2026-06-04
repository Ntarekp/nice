/**
 * Creates per-service PostgreSQL databases on a single local server.
 * Uses root .env (DB_HOST, DB_USER, DB_PASS).
 */
const path = require("path");
const { Client } = require(path.join(
  __dirname,
  "../services/user-service/node_modules/pg"
));

require(path.join(__dirname, "../services/user-service/node_modules/dotenv")).config({
  path: path.join(__dirname, "../.env"),
});

const DATABASES = [
  "users_db",
  "equipment_db",
  "inspections_db",
  "reports_db",
  "notifications_db",
];

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS,
    database: "postgres",
  });

  await client.connect();
  console.log("\n══ Creating TWZ databases ══\n");

  for (const name of DATABASES) {
    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name]
    );
    if (exists.rowCount > 0) {
      console.log(`  ✔ ${name} (already exists)`);
      continue;
    }
    await client.query(`CREATE DATABASE "${name}"`);
    console.log(`  ✔ ${name} (created)`);
  }

  await client.end();
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error("Database setup failed:", err.message);
  process.exit(1);
});
