const fs = require("fs");
const path = require("path");

const md = fs.readFileSync(
  path.join(__dirname, "../docs/frontend-brief-codes.md"),
  "utf8"
);

const files = [
  ["frontend/src/main.jsx", "jsx"],
  ["frontend/src/App.jsx", "jsx"],
  ["frontend/src/stores/auth.store.js", "javascript"],
  ["frontend/src/lib/api.js", "javascript"],
  ["frontend/src/index.css", "css"],
  ["frontend/src/pages/Login.jsx", "jsx"],
  ["frontend/src/pages/OtpVerify.jsx", "jsx"],
  ["frontend/src/pages/ChangePassword.jsx", "jsx"],
  ["frontend/src/layouts/DashboardLayout.jsx", "jsx"],
  ["frontend/src/pages/Dashboard.jsx", "jsx"],
  ["frontend/src/pages/Extinguishers.jsx", "jsx"],
  ["frontend/src/pages/Reports.jsx", "jsx"],
];

function extract(rel, lang) {
  const marker = `### \`${rel}\``;
  const start = md.indexOf(marker);
  if (start === -1) throw new Error(`Marker not found: ${rel}`);

  const openFence = "```" + lang;
  const open = md.indexOf(openFence, start);
  if (open === -1) throw new Error(`Open fence not found: ${rel}`);

  const contentStart = md.indexOf("\n", open) + 1;
  const close = md.indexOf("\n```", contentStart);
  if (close === -1) throw new Error(`Close fence not found: ${rel}`);

  return md.slice(contentStart, close).trimEnd() + "\n";
}

for (const [rel, lang] of files) {
  const content = extract(rel, lang);
  const full = path.join(__dirname, "..", rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log("OK", rel, content.length, "bytes");
}
