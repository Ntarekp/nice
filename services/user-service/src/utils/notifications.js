const axios = require("axios");

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL;

const sendNotification = async (type, payload, { required = false } = {}) => {
  if (!NOTIFICATION_URL) {
    const err = new Error("NOTIFICATION_SERVICE_URL is not configured");
    if (required) throw err;
    return { success: false, emailSent: false, error: err.message };
  }

  try {
    const { data } = await axios.post(
      `${NOTIFICATION_URL}/api/notifications/send`,
      { type, payload },
      { timeout: 20000 }
    );

    if (data.devFallback) {
      console.warn(
        `[user-service] Email dev fallback ${type} → ${payload.email}`,
        payload.tempPassword || payload.otp || ""
      );
    }
    return data;
  } catch (e) {
    const detail = e.response?.data?.error || e.response?.data?.details || e.message;
    console.error("[user-service] Notification send failed:", detail);
    if (required) {
      const err = new Error(detail || "Failed to send email");
      err.status = e.response?.status || 503;
      throw err;
    }
    return { success: false, emailSent: false, error: detail };
  }
};

module.exports = { sendNotification };
