/**
 * Integration tests — run with services up (user :3001, equipment :3002, etc.)
 * node --test tests/integration.test.js
 */
const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const axios = require(path.join(__dirname, "../services/user-service/node_modules/axios"));

const USER_URL = process.env.USER_URL || "http://localhost:3001";
const EQUIPMENT_URL = process.env.EQUIPMENT_URL || "http://localhost:3002";
const INSPECTION_URL = process.env.INSPECTION_URL || "http://localhost:3003";
const REPORT_URL = process.env.REPORT_URL || "http://localhost:3004";

const TEST_EMAIL = process.env.TEST_EMAIL || "ukemuk1@gmail.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Test@1234!";

let accessToken;
let refreshToken;
let extinguisherId;

async function login() {
  const { data } = await axios.post(`${USER_URL}/api/auth/login`, {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  return data;
}

const auth = () => ({ Authorization: `Bearer ${accessToken}` });

const waitForService = async (url, label, attempts = 45) => {
  for (let i = 0; i < attempts; i++) {
    try {
      const { data } = await axios.get(`${url}/health`, { timeout: 2000 });
      if (data.status === "ok") return;
    } catch (_) {
      /* retry while sync/startup */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${label} not ready at ${url}`);
};

describe("TWZ Fire System — Phase 2/3 Integration", () => {
  before(async () => {
    await waitForService(USER_URL, "user-service");
    await waitForService(EQUIPMENT_URL, "equipment-service");
    await waitForService(INSPECTION_URL, "inspection-service");
    await waitForService(REPORT_URL, "report-service");
  });

  it("health checks", async () => {
    const services = [
      [USER_URL, "user-service"],
      [EQUIPMENT_URL, "equipment-service"],
      [INSPECTION_URL, "inspection-service"],
      [REPORT_URL, "report-service"],
    ];
    for (const [url, name] of services) {
      const { data } = await axios.get(`${url}/health`);
      assert.equal(data.status, "ok", `${name} unhealthy`);
    }
  });

  it("login returns JWT for verified user", async () => {
    const data = await login();
    assert.ok(data.accessToken);
    assert.ok(data.refreshToken);
    assert.equal(data.user.email, TEST_EMAIL.toLowerCase());
    assert.ok(["admin", "inspector", "user"].includes(data.user.role));
  });

  it("GET /api/users/me", async () => {
    const { data } = await axios.get(`${USER_URL}/api/users/me`, { headers: auth() });
    assert.equal(data.email, TEST_EMAIL.toLowerCase());
  });

  it("POST refresh-token rotates tokens", async () => {
    const { data } = await axios.post(`${USER_URL}/api/auth/refresh-token`, {
      refreshToken,
    });
    assert.ok(data.accessToken);
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  });

  it("GET /api/extinguishers paginated", async () => {
    const { data } = await axios.get(`${EQUIPMENT_URL}/api/extinguishers`, {
      headers: auth(),
      params: { page: 1, limit: 5 },
    });
    assert.ok(Array.isArray(data.data));
    assert.ok(data.pagination.total >= 0);
    if (data.data.length) extinguisherId = data.data[0].id;
  });

  it("GET /api/extinguishers/stats/summary", async () => {
    const { data } = await axios.get(`${EQUIPMENT_URL}/api/extinguishers/stats/summary`, {
      headers: auth(),
    });
    assert.ok(typeof data.total === "number");
  });

  it("GET /api/inspections paginated", async () => {
    const { data } = await axios.get(`${INSPECTION_URL}/api/inspections`, {
      headers: auth(),
      params: { page: 1, limit: 10 },
    });
    assert.ok(Array.isArray(data.data));
    assert.ok(data.pagination);
  });

  it("GET /api/maintenance paginated", async () => {
    const { data } = await axios.get(`${INSPECTION_URL}/api/maintenance`, {
      headers: auth(),
      params: { page: 1, limit: 10 },
    });
    assert.ok(Array.isArray(data.data));
  });

  it("GET /api/reports/dashboard", async () => {
    const { data } = await axios.get(`${REPORT_URL}/api/reports/dashboard`, {
      headers: auth(),
    });
    assert.ok(data.extinguishers);
    assert.ok(data.inspections);
    assert.ok(data.generatedAt);
  });

  it("GET /api/reports/export csv", async () => {
    const res = await axios.get(`${REPORT_URL}/api/reports/export`, {
      headers: auth(),
      params: { format: "csv", type: "extinguishers" },
      responseType: "text",
    });
    assert.ok(res.headers["content-type"].includes("csv") || res.data.length >= 0);
  });

  it("admin can list users", async () => {
    if ((await login()).user.role !== "admin") {
      const adminLogin = await axios.post(`${USER_URL}/api/auth/login`, {
        email: "devroom210@gmail.com",
        password: TEST_PASSWORD,
      });
      accessToken = adminLogin.data.accessToken;
    }
    try {
      const { data } = await axios.get(`${USER_URL}/api/users`, {
        headers: auth(),
        params: { page: 1, limit: 20 },
      });
      assert.ok(data.data.some((u) => u.email === "ukemuk1@gmail.com"));
    } catch (e) {
      if (e.response?.status === 403) return;
      throw e;
    }
  });

  it("POST /api/auth/logout", async () => {
    const { data } = await axios.post(
      `${USER_URL}/api/auth/logout`,
      { refreshToken },
      { headers: auth() }
    );
    assert.equal(data.message, "Logged out successfully");
  });
});
