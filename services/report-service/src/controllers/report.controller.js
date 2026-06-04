const axios = require("axios");
const PDFDocument = require("pdfkit");
const { Parser } = require("json2csv");

const EQUIPMENT_URL = process.env.EQUIPMENT_SERVICE_URL;
const INSPECTION_URL = process.env.INSPECTION_SERVICE_URL;

const fetchAll = async (url, token) => {
  const res = await axios.get(url, {
    headers: { Authorization: token },
    params: { limit: 1000, page: 1 },
  });
  return res.data;
};

exports.dashboard = async (req, res) => {
  const token = req.headers.authorization;

  const [extStats, inspections, maintenance] = await Promise.all([
    axios.get(`${EQUIPMENT_URL}/api/extinguishers/stats/summary`, {
      headers: { Authorization: token },
    }),
    fetchAll(`${INSPECTION_URL}/api/inspections`, token),
    fetchAll(`${INSPECTION_URL}/api/maintenance`, token),
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
  });
};

exports.export = async (req, res) => {
  const { format = "pdf", type = "extinguishers" } = req.query;
  const token = req.headers.authorization;

  let data = [];
  let title = "";

  if (type === "extinguishers") {
    const r = await fetchAll(`${EQUIPMENT_URL}/api/extinguishers`, token);
    data = r.data || [];
    title = "Fire Extinguishers Report";
  } else if (type === "inspections") {
    const r = await fetchAll(`${INSPECTION_URL}/api/inspections`, token);
    data = r.data || [];
    title = "Inspections Report";
  } else if (type === "maintenance") {
    const r = await fetchAll(`${INSPECTION_URL}/api/maintenance`, token);
    data = r.data || [];
    title = "Maintenance History Report";
  } else {
    return res.status(400).json({ error: "Invalid report type" });
  }

  if (format === "csv") {
    const parser = new Parser();
    const csv = data.length ? parser.parse(data) : "";
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-${Date.now()}.csv"`);
    return res.send(csv);
  }

  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${type}-${Date.now()}.pdf"`);
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 60).fill("#1a1a2e");
  doc.fillColor("white").fontSize(18).text("TWZ LTD — Fire Safety Management", 40, 15);
  doc.fontSize(11).text(title, 40, 38);
  doc
    .fillColor("#666")
    .fontSize(9)
    .text(
      `Generated: ${new Date().toLocaleString()}  |  Records: ${data.length}`,
      doc.page.width - 280,
      42
    );

  if (data.length === 0) {
    doc.fillColor("#333").fontSize(10).text("No records found.", 40, 80);
  } else {
    const fields = Object.keys(data[0]).filter(
      (k) => !["id", "createdBy", "updatedAt", "createdAt"].includes(k)
    );
    const displayFields = fields.slice(0, 8);
    const colWidth = (doc.page.width - 80) / displayFields.length;
    let y = 80;

    doc.rect(40, y, doc.page.width - 80, 20).fill("#e8e8e8");
    doc.fillColor("#333").fontSize(8);
    displayFields.forEach((f, i) => {
      doc.text(f.replace(/([A-Z])/g, " $1").trim(), 42 + i * colWidth, y + 6, {
        width: colWidth - 4,
      });
    });

    y += 22;
    data.slice(0, 50).forEach((row, ri) => {
      if (y > doc.page.height - 60) {
        doc.addPage({ layout: "landscape", margin: 40 });
        y = 40;
      }
      if (ri % 2 === 0) doc.rect(40, y, doc.page.width - 80, 16).fill("#f9f9f9");
      doc.fillColor("#333").fontSize(7);
      displayFields.forEach((f, i) => {
        doc.text(String(row[f] ?? "").substring(0, 25), 42 + i * colWidth, y + 4, {
          width: colWidth - 4,
        });
      });
      y += 18;
    });
  }

  doc.end();
};
