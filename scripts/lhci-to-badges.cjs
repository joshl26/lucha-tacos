// scripts/lhci-to-badges.cjs
const fs = require("fs");
const path = require("path");

const lhciDir = path.resolve(".lighthouseci");
if (!fs.existsSync(lhciDir)) {
  console.error("No .lighthouseci directory found");
  process.exit(0);
}

// Look for LHR files (not assertion-results.json)
const lhrFiles = fs
  .readdirSync(lhciDir)
  .filter((f) => f.startsWith("lhr-") && f.endsWith(".json"));
if (!lhrFiles.length) {
  console.error("No LHR files found in .lighthouseci/");
  process.exit(0);
}

const lhrFile = path.join(lhciDir, lhrFiles[0]);
console.log("Reading LHR from", lhrFile);
const data = JSON.parse(fs.readFileSync(lhrFile, "utf8"));

// Handle both raw LHR and wrapped formats
const lhr = data.lhr || data;

if (!lhr.categories) {
  console.error("No categories found in LHR data");
  process.exit(0);
}

const scores = {};
for (const [key, value] of Object.entries(lhr.categories || {})) {
  scores[key] = Math.round((value.score || 0) * 100);
}

const outDir = path.resolve("public_badges");
fs.mkdirSync(outDir, { recursive: true });

for (const [cat, score] of Object.entries(scores)) {
  const json = {
    schemaVersion: 1,
    label: `lighthouse-${cat}`,
    message: String(score),
    color: score >= 90 ? "brightgreen" : score >= 75 ? "yellow" : "orange",
  };
  const filename = `lighthouse-${cat}.json`;
  fs.writeFileSync(path.join(outDir, filename), JSON.stringify(json, null, 2));
  console.log(`Wrote badge: ${filename} (${score})`);
}

console.log("LHCI badges written:", Object.keys(scores));
