/**
 * End-to-end login → verify OTP test via API gateway.
 * Usage: node scripts/test-login-otp.js [email] [password]
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
const email = process.argv[2] || "cabledie@gmail.com";
const password = process.argv[3] || "Test@1234!";

async function main() {
  console.log("\n══ Login OTP flow test ══\n");
  console.log("Gateway:", GATEWAY);
  console.log("Email:", email);

  let loginBody;
  try {
    await axios.post(`${GATEWAY}/api/auth/login`, { email, password });
    console.error("FAIL: login returned 200 (expected 403 + OTP)");
    process.exit(1);
  } catch (err) {
    loginBody = err.response?.data;
    console.log("Login status:", err.response?.status);
    console.log("Login body:", loginBody);
    if (err.response?.status !== 403 || !loginBody?.requiresOtp) {
      console.error("FAIL: expected 403 requiresOtp");
      process.exit(1);
    }
  }

  const otp =
    loginBody.devOtpHint ||
    (await promptOtpFromDb(loginBody.userId, loginBody.purpose));

  const verify = await axios.post(`${GATEWAY}/api/auth/verify-otp`, {
    userId: loginBody.userId,
    otp: String(otp),
    purpose: loginBody.purpose || "login",
  });

  console.log("\nVerify OK:", {
    user: verify.data.user?.email,
    role: verify.data.user?.role,
    hasToken: !!verify.data.accessToken,
  });
  console.log("\nDone.\n");
}

async function promptOtpFromDb(userId, purpose) {
  const { OtpCode, sequelize } = require(path.join(
    __dirname,
    "../services/user-service/src/models"
  ));
  const record = await OtpCode.findOne({
    where: { userId, purpose: purpose || "login", isUsed: false },
    order: [["createdAt", "DESC"]],
  });
  await sequelize.close();
  if (!record) throw new Error("No OTP row in database — check user-service logs");
  console.log("OTP from DB:", record.otpCode);
  return record.otpCode;
}

main().catch((e) => {
  console.error(e.response?.data || e.message);
  process.exit(1);
});
