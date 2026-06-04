/**
 * Deactivates legacy/demo accounts so the admin Users page only reflects real accounts.
 * Keeps: benmu91@gmail.com, cabledie@gmail.com, devroom210@gmail.com
 */
const path = require("path");
const dotenv = require(path.join(
  __dirname,
  "../services/user-service/node_modules/dotenv"
));

dotenv.config({ path: path.join(__dirname, "../services/user-service/.env") });

const KEEP_EMAILS = [
  "benmu91@gmail.com",
  "cabledie@gmail.com",
  "devroom210@gmail.com",
];

const LEGACY_EMAILS = [
  "admin@twzltd.com",
  "ukemuk1@gmail.com",
];

async function main() {
  const { User, sequelize } = require("../services/user-service/src/models");
  const { Op } = require(path.join(__dirname, "../services/user-service/node_modules/sequelize"));

  await sequelize.authenticate();

  const toDeactivate = await User.findAll({
    where: {
      isActive: true,
      email: {
        [Op.notIn]: KEEP_EMAILS.map((e) => e.toLowerCase()),
      },
    },
  });

  let count = 0;
  for (const user of toDeactivate) {
    await user.update({ isActive: false });
    console.log(`  ✔ Deactivated: ${user.email}`);
    count += 1;
  }

  for (const email of LEGACY_EMAILS) {
    const legacy = await User.findOne({ where: { email: email.toLowerCase() } });
    if (legacy?.isActive) {
      await legacy.update({ isActive: false });
      console.log(`  ✔ Deactivated legacy: ${legacy.email}`);
      count += 1;
    }
  }

  await sequelize.close();
  console.log(`\nDone. Deactivated ${count} account(s). Active users:\n`);
  KEEP_EMAILS.forEach((e) => console.log(`  • ${e}`));
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
