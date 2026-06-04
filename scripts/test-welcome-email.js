/**
 * Verifies admin create-user sends welcome email with temp password.
 * Usage: node scripts/test-welcome-email.js [recipient@test.com]
 */
const path = require("path");
const axios = require(path.join(
  __dirname,
  "../services/user-service/node_modules/axios"
));
const dotenv = require(path.join(
  __dirname,
  "../services/user-service/node_modules/dotenv"
));

dotenv.config({ path: path.join(__dirname, "../.env") });

const GATEWAY = process.env.GATEWAY_URL || "http://localhost:3000";
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3005";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "devroom210@gmail.com";
const ADMIN_PASSWORD = process.env.TEST_PASSWORD || "Test@1234!";
const newUserEmail =
  process.argv[2] || `twz-test-${Date.now()}@example.com`;

async function adminToken() {
  let loginRes;
  try {
    await axios.post(`${GATEWAY}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    throw new Error("Expected login 403 (OTP required)");
  } catch (err) {
    loginRes = err.response;
  }
  if (loginRes?.status !== 403 || !loginRes.data?.userId) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginRes?.data)}`);
  }

  const { OtpCode, sequelize } = require(path.join(
    __dirname,
    "../services/user-service/src/models"
  ));
  const { userId, purpose, devOtpHint } = loginRes.data;
  let otp = devOtpHint;
  if (!otp) {
    const row = await OtpCode.findOne({
      where: { userId, purpose: purpose || "login", isUsed: false },
      order: [["createdAt", "DESC"]],
    });
    otp = row?.otpCode;
    await sequelize.close();
  }
  if (!otp) throw new Error("Could not resolve admin OTP");

  const { data } = await axios.post(`${GATEWAY}/api/auth/verify-otp`, {
    userId,
    otp: String(otp),
    purpose: purpose || "login",
  });
  return data.accessToken;
}

async function main() {
  console.log("\n══ Welcome email (create user) test ══\n");
  console.log("Gateway:", GATEWAY);
  console.log("Notification:", NOTIFICATION_URL);
  console.log("New user email:", newUserEmail);

  const token = await adminToken();
  console.log("Admin authenticated.\n");

  const createRes = await axios.post(
    `${GATEWAY}/api/users`,
    {
      firstName: "Welcome",
      lastName: "Test",
      email: newUserEmail,
      role: "user",
      phone: "+250700000000",
      department: "QA",
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log("Create user API:", createRes.status, createRes.data.message);
  console.log("User id:", createRes.data.user?.id);

  const directWelcome = await axios.post(
    `${NOTIFICATION_URL}/api/notifications/send`,
    {
      type: "welcome",
      payload: {
        email: newUserEmail,
        name: "DirectTest",
        tempPassword: "TestTemp99!",
        role: "user",
      },
    }
  );
  console.log("\nDirect welcome send (sanity):", directWelcome.data);

  console.log(
    "\nCheck inbox for:",
    newUserEmail,
    "(create-user email) and compare with direct test if using real SMTP.\n"
  );
}

main().catch((e) => {
  console.error(e.response?.data || e.message);
  process.exit(1);
});
