// scripts/playwright-to-badge.js
const fs = require("fs");
const path = require("path");

const reportPath = path.resolve("test-results", "results.json"); // ensure your Playwright job writes JSON here
if (!fs.existsSync(reportPath)) {
  console.error("No Playwright results file found at", reportPath);
  process.exit(0);
}
const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));

// Adjust parsing depending on reporter output shape:
const total =
  r?.suites?.reduce((acc, s) => acc + (s.tests?.length || 0), 0) ||
  r.total ||
  0;
const passed =
  r?.suites?.reduce(
    (acc, s) =>
      acc + (s.tests?.filter((t) => t.status === "passed").length || 0),
    0
  ) ||
  r.passed ||
  0;
const percent = total ? Math.round((passed / total) * 100) : 0;

const json = {
  schemaVersion: 1,
  label: "playwright",
  message: `${percent}%`,
  color: percent === 100 ? "brightgreen" : percent >= 80 ? "yellow" : "orange",
};

const outDir = path.resolve("public_badges");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "playwright.json"), JSON.stringify(json));
console.log("Playwright badge written:", percent);
