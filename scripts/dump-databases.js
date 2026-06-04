/**
 * Dumps all TWZ PostgreSQL databases to dumps/*.sql (plain SQL, schema + data).
 * Uses credentials from root .env (DB_HOST, DB_USER, DB_PASS).
 *
 * Requires pg_dump on PATH or PG_DUMP env (e.g. C:\Program Files\PostgreSQL\18\bin\pg_dump.exe).
 */
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

require(path.join(__dirname, "../services/user-service/node_modules/dotenv")).config({
  path: path.join(__dirname, "../.env"),
});

const DATABASES = [
  process.env.DB_NAME_USERS || "users_db",
  process.env.DB_NAME_EQUIPMENT || "equipment_db",
  process.env.DB_NAME_INSPECTIONS || "inspections_db",
  process.env.DB_NAME_REPORTS || "reports_db",
  process.env.DB_NAME_NOTIFICATIONS || "notifications_db",
];

const OUT_DIR = path.join(__dirname, "../dumps");

function resolvePgDump() {
  if (process.env.PG_DUMP && fs.existsSync(process.env.PG_DUMP)) {
    return process.env.PG_DUMP;
  }
  const candidates = [
    "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe",
    "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
    "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
    "pg_dump",
  ];
  for (const c of candidates) {
    if (c === "pg_dump") {
      const which = spawnSync("where", ["pg_dump"], { encoding: "utf8", shell: true });
      if (which.status === 0 && which.stdout?.trim()) return "pg_dump";
      continue;
    }
    if (fs.existsSync(c)) return c;
  }
  return "pg_dump";
}

function main() {
  if (!process.env.DB_PASS) {
    console.error("DB_PASS missing in .env");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pgDump = resolvePgDump();
  const host = process.env.DB_HOST || "localhost";
  const port = String(process.env.DB_PORT || 5432);
  const user = process.env.DB_USER || "postgres";
  const env = { ...process.env, PGPASSWORD: process.env.DB_PASS };

  console.log(`Using ${pgDump}`);
  console.log(`Output: ${OUT_DIR}\n`);

  let failed = 0;
  for (const db of DATABASES) {
    const outFile = path.join(OUT_DIR, `${db}.sql`);
    const args = [
      "-h", host,
      "-p", port,
      "-U", user,
      "-d", db,
      "--no-owner",
      "--no-acl",
      "--if-exists",
      "--clean",
      "-f", outFile,
    ];

    const result = spawnSync(pgDump, args, { env, stdio: "pipe", encoding: "utf8" });
    if (result.status !== 0) {
      failed += 1;
      console.error(`FAIL ${db}:`, result.stderr || result.error?.message || "unknown error");
      continue;
    }
    const stat = fs.statSync(outFile);
    console.log(`OK   ${db}.sql (${(stat.size / 1024).toFixed(1)} KB)`);
  }

  if (failed) {
    console.error(`\n${failed} dump(s) failed. Ensure databases exist (npm run db:create) and PostgreSQL is running.`);
    process.exit(1);
  }
  console.log("\nAll database dumps saved to dumps/");
}

main();
