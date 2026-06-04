const axios = require("axios");
const PDFDocument = require("pdfkit");
const { Parser } = require("json2csv");

const EQUIPMENT_URL = process.env.EQUIPMENT_SERVICE_URL;
const INSPECTION_URL = process.env.INSPECTION_SERVICE_URL;

const ALLOWED_TYPES = {
  admin: ["extinguishers", "inspections", "maintenance"],
  inspector: ["extinguishers", "inspections", "maintenance"],
  user: ["extinguishers", "inspections"],
};

const fetchAll = async (url, token) => {
  const res = await axios.get(url, {
    headers: { Authorization: token },
    params: { limit: 1000, page: 1 },
  });
  return res.data;
};

const flattenRow = (row) => {
  const flat = {};
  for (const [key, val] of Object.entries(row)) {
    if (val === null || val === undefined) flat[key] = "";
    else if (typeof val === "object" && !(val instanceof Date)) {
      flat[key] = JSON.stringify(val);
    } else if (val instanceof Date) {
      flat[key] = val.toISOString();
    } else {
      flat[key] = val;
    }
  }
  return flat;
};

exports.dashboard = async (req, res) => {
  const token = req.headers.authorization;

  try {
    const [extStats, inspections, maintenance] = await Promise.all([
      axios.get(`${EQUIPMENT_URL}/api/extinguishers/stats/summary`, {
        headers: { Authorization: token },
      }),
      fetchAll(`${INSPECTION_URL}/api/inspections`, token),
      req.user.role === "user"
        ? Promise.resolve({ data: [] })
        : fetchAll(`${INSPECTION_URL}/api/maintenance`, token),
    ]);

    const inspData = inspections.data || [];
    const maintData = maintenance.data || [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    res.json({
      extinguishers: extStats.data,
      inspections: {
        total: inspData.length,
        scheduled: inspData.filter((i) => i.status === "scheduled").length,
        completed: inspData.filter((i) => i.status === "completed").length,
        missed: inspData.filter((i) => i.status === "missed").length,
        today: inspData.filter((i) => new Date(i.scheduledDate) >= dayStart).length,
        thisMonth: inspData.filter((i) => new Date(i.scheduledDate) >= monthStart).length,
        thisYear: inspData.filter((i) => new Date(i.scheduledDate) >= yearStart).length,
      },
      maintenance: {
        total: maintData.length,
        thisMonth: maintData.filter((m) => new Date(m.actionDate) >= monthStart).length,
        thisYear: maintData.filter((m) => new Date(m.actionDate) >= yearStart).length,
      },
      generatedAt: new Date().toISOString(),
      role: req.user.role,
    });
  } catch (err) {
    console.error("[report-service] dashboard:", err.message);
    res.status(502).json({ error: "Failed to load dashboard data" });
  }
};

exports.export = async (req, res) => {
  const { format = "pdf", type = "extinguishers" } = req.query;
  const token = req.headers.authorization;
  const role = req.user?.role;

  const allowed = ALLOWED_TYPES[role] || [];
  if (!allowed.includes(type)) {
    return res.status(403).json({
      error: `Your role cannot export ${type} reports`,
    });
  }

  let data = [];
  let title = "";

  try {
    if (type === "extinguishers") {
      const r = await fetchAll(`${EQUIPMENT_URL}/api/extinguishers`, token);
      data = (r.data || []).map(flattenRow);
      title = "Fire Extinguishers Report";
    } else if (type === "inspections") {
      const r = await fetchAll(`${INSPECTION_URL}/api/inspections`, token);
      data = (r.data || []).map(flattenRow);
      title = "Inspections Report";
    } else if (type === "maintenance") {
      const r = await fetchAll(`${INSPECTION_URL}/api/maintenance`, token);
      data = (r.data || []).map(flattenRow);
      title = "Maintenance History Report";
    } else {
      return res.status(400).json({ error: "Invalid report type" });
    }
  } catch (err) {
    console.error("[report-service] export fetch:", err.message);
    return res.status(502).json({ error: "Failed to fetch report data" });
  }

  const stamp = Date.now();
  const safeRole = role || "user";

  if (format === "csv") {
    const fields =
      data.length > 0
        ? Object.keys(data[0])
        : ["message"];
    const rows =
      data.length > 0 ? data : [{ message: "No records found for your scope" }];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${type}-${safeRole}-${stamp}.csv"`
    );
    return res.send(csv);
  }

  if (format !== "pdf") {
    return res.status(400).json({ error: "Format must be pdf or csv" });
  }

  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${type}-${safeRole}-${stamp}.pdf"`
  );
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 60).fill("#1a1a1a");
  doc.fillColor("white").fontSize(18).text("TWZ LTD — Fire Safety Management", 40, 15);
  doc.fontSize(11).text(title, 40, 38);
  doc
    .fillColor("#cccccc")
    .fontSize(9)
    .text(
      `Generated: ${new Date().toLocaleString()}  |  Role: ${safeRole}  |  Records: ${data.length}`,
      40,
      52
    );

  if (data.length === 0) {
    doc.fillColor("#333").fontSize(11).text("No records found for your access scope.", 40, 90);
  } else {
    const skip = new Set(["id", "createdBy", "updatedAt", "createdAt", "qrCode"]);
    const fields = Object.keys(data[0]).filter((k) => !skip.has(k)).slice(0, 9);
    const colWidth = (doc.page.width - 80) / fields.length;
    let y = 85;

    doc.rect(40, y, doc.page.width - 80, 22).fill("#eceef1");
    doc.fillColor("#333").fontSize(8);
    fields.forEach((f, i) => {
      doc.text(
        f.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim(),
        42 + i * colWidth,
        y + 7,
        { width: colWidth - 4 }
      );
    });

    y += 26;
    data.slice(0, 80).forEach((row, ri) => {
      if (y > doc.page.height - 50) {
        doc.addPage({ layout: "landscape", margin: 40 });
        y = 40;
      }
      if (ri % 2 === 0) doc.rect(40, y, doc.page.width - 80, 18).fill("#f8f9fa");
      doc.fillColor("#333").fontSize(7);
      fields.forEach((f, i) => {
        doc.text(String(row[f] ?? "").substring(0, 28), 42 + i * colWidth, y + 5, {
          width: colWidth - 4,
        });
      });
      y += 18;
    });
  }

  doc.end();
};
