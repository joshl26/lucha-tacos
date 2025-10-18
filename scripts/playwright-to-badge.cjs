#!/usr/bin/env node
// scripts/playwright-to-badge.js
const fs = require("fs");
const path = require("path");

const reportPath = path.resolve("test-results", "results.json");
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

// Extract total/passed from flat structure
let total = 0;
let passed = 0;

function traverseSuites(suites) {
  if (!suites || !Array.isArray(suites)) return;
  for (const suite of suites) {
    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        if (Array.isArray(spec.tests)) {
          for (const test of spec.tests) {
            total += 1;
            if (test.status === "passed" || test.ok === true) {
              passed += 1;
            }
          }
        }
      }
    }
    if (Array.isArray(suite.suites)) {
      traverseSuites(suite.suites); // recurse
    }
  }
}

// Start traversal from root suites
if (Array.isArray(r.suites)) {
  traverseSuites(r.suites);
}

// Fallback to stats if available
if (total === 0 && r.stats) {
  total = r.stats.expected + r.stats.unexpected + r.stats.flaky;
  passed = r.stats.expected;
}

const percent = total ? Math.round((passed / total) * 100) : 0;

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
  message: total ? `${passed}/${total}` : "0/0",
  color: colorForPercent(percent),
};

const outDir = path.resolve("public_badges");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "playwright.json");

fs.writeFileSync(outPath, JSON.stringify(badge, null, 2), "utf8");
console.log(`Playwright badge written: ${outPath} (${passed}/${total})`);
