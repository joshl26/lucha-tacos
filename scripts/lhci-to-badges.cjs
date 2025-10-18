// scripts/lhci-to-badges.js
const fs = require("fs");
const path = require("path");

const lhciDir = path.resolve(".lighthouseci");
const files = fs.readdirSync(lhciDir).filter((f) => f.endsWith(".json"));
if (!files.length) {
  console.error("No LHCI JSON files found");
  process.exit(0);
}

// pick the most recent or first LHR file
const lhrFile = path.join(lhciDir, files[0]);
const data = JSON.parse(fs.readFileSync(lhrFile, "utf8"));
const lhr = data.lhr || data;

const scores = {};
for (const [key, value] of Object.entries(lhr.categories || {})) {
  scores[key] = Math.round((value.score || 0) * 100);
}

const outDir = path.resolve("public_badges");
fs.mkdirSync(outDir, { recursive: true });

for (const [cat, score] of Object.entries(scores)) {
  const json = {
    schemaVersion: 1,
    label: cat,
    message: String(score),
    color: score >= 90 ? "brightgreen" : score >= 75 ? "yellow" : "orange",
  };
  fs.writeFileSync(
    path.join(outDir, `lighthouse-${cat}.json`),
    JSON.stringify(json)
  );
}
console.log("LHCI badges written:", Object.keys(scores));
