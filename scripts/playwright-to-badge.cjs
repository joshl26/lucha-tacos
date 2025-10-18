// scripts/playwright-to-badge.js
const fs = require("fs");
const path = require("path");

const reportPath = path.resolve("test-results", "results.json"); // ensure your Playwright job writes JSON here
if (!fs.existsSync(reportPath)) {
  console.error("No Playwright results file found at", reportPath);
  process.exit(0);
}

let r;
try {
  r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
} catch (err) {
  console.error("Failed to parse Playwright JSON:", err.message);
  process.exit(1);
}

// Helper: try common top-level stats first
let total = 0;
let passed = 0;

if (typeof r.total === "number" && typeof r.passed === "number") {
  total = r.total;
  passed = r.passed;
} else if (r.stats && typeof r.stats.total === "number") {
  total = r.stats.total || 0;
  passed = r.stats.passed || 0;
} else {
  // Recursive traversal for nested suites/tests
  function traverse(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(traverse);
      return;
    }

    // If this node directly contains tests
    if (Array.isArray(node.tests) && node.tests.length) {
      node.tests.forEach((t) => {
        total += 1;
        // Try common properties for status/outcome
        const status =
          t.status ||
          (t.result && t.result.status) ||
          (typeof t.ok === "boolean"
            ? t.ok
              ? "passed"
              : "failed"
            : undefined) ||
          t.outcome ||
          t.statusText ||
          null;

        if (status && String(status).toLowerCase() === "passed") {
          passed += 1;
        }
      });
    }

    // Recurse into nested suites (common shapes: suites, entries, children)
    if (Array.isArray(node.suites)) traverse(node.suites);
    if (Array.isArray(node.children)) traverse(node.children);
    if (Array.isArray(node.entries)) traverse(node.entries);
    if (Array.isArray(node.tests)) traverse(node.tests);
  }

  // Try likely entry points
  if (Array.isArray(r.suites)) traverse(r.suites);
  else if (Array.isArray(r.tests)) traverse(r.tests);
  else traverse(r);
}

// Safeguard: ensure numeric
total = Number(total) || 0;
passed = Number(passed) || 0;

const percent = total ? Math.round((passed / total) * 100) : 0;

// Color mapping — tweak thresholds as you like
function colorForPercent(p) {
  if (total === 0) return "lightgrey";
  if (p === 100) return "brightgreen";
  if (p >= 90) return "green";
  if (p >= 75) return "yellowgreen";
  if (p >= 50) return "yellow";
  if (p > 0) return "orange";
  return "red";
}

const badge = {
  schemaVersion: 1,
  label: "playwright",
  message: `${percent}%`,
  color: colorForPercent(percent),
  // optionally include a subtitle field for debugging; shields ignores extra fields
  details: { passed, total },
};

const outDir = path.resolve("public_badges");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "playwright.json");

fs.writeFileSync(outPath, JSON.stringify(badge, null, 2), "utf8");
console.log(
  "Playwright badge written:",
  outPath,
  `(${passed}/${total} -> ${percent}%)`
);
