/**
 * Tests SMTP + notification send + OTP storage.
 * Usage: node scripts/test-email-otp.js [recipient@email.com]
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

const NOTIFICATION_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3005";
const to = process.argv[2] || process.env.SMTP_USER || "devroom210@gmail.com";

async function main() {
  console.log("\n══ TWZ Email / OTP Test ══\n");
  console.log("Notification URL:", NOTIFICATION_URL);
  console.log("Recipient:", to);

  try {
    const health = await axios.get(`${NOTIFICATION_URL}/health`, { timeout: 5000 });
    console.log("Service health:", health.data);
  } catch (e) {
    console.error("Notification service not reachable. Start: npm run dev");
    process.exit(1);
  }

  try {
    const smtp = await axios.get(`${NOTIFICATION_URL}/api/notifications/smtp-status`, {
      timeout: 15000,
    });
    console.log("\nSMTP status:", smtp.data);
    if (!smtp.data.configured) {
      console.error("SMTP not configured in notification-service .env");
      process.exit(1);
    }
    if (!smtp.data.verified) {
      console.error("SMTP verify failed:", smtp.data.error);
      process.exit(1);
    }
  } catch (e) {
    console.error("SMTP status check failed:", e.response?.data || e.message);
    process.exit(1);
  }

  const testOtp = String(Math.floor(100000 + Math.random() * 900000));
  try {
    const send = await axios.post(`${NOTIFICATION_URL}/api/notifications/send`, {
      type: "otp",
      payload: {
        email: to,
        name: "Test User",
        otp: testOtp,
        purpose: "email delivery test",
      },
    });
    console.log("\nSend OTP result:", send.data);
    if (send.data.devFallback) {
      console.warn("Email not sent — dev fallback OTP:", send.data.otp);
    } else {
      console.log("Check inbox for OTP:", testOtp);
    }
  } catch (e) {
    console.error("Send failed:", e.response?.data || e.message);
    process.exit(1);
  }

  console.log("\nDone.\n");
}

main();
