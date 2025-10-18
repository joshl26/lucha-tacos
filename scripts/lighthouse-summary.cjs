#!/usr/bin/env node
// scripts/lighthouse-summary.js
// Parse and display Lighthouse CI results and assertion-results in a friendly format
// Also supports writing badge JSON files for Shields.io

const fs = require("fs");
const path = require("path");

const MANIFEST_PATH = ".lighthouseci/assertion-results.json";
const LHCI_MANIFEST_PATH = ".lighthouseci/assertion-results.json"; // same file often
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function colorScore(score) {
  if (score == null) return COLORS.yellow;
  if (score >= 0.9) return COLORS.green;
  if (score >= 0.7) return COLORS.yellow;
  return COLORS.red;
}

function formatScore(score) {
  if (score == null) return `${COLORS.yellow}N/A${COLORS.reset}`;
  const percentage = Math.round(score * 100);
  const color = colorScore(score);
  return `${color}${percentage}${COLORS.reset}`;
}

function formatMetric(value, unit = "ms") {
  if (value == null) return "N/A";
  return `${Math.round(value)}${unit}`;
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(
      `${COLORS.red}Error: No Lighthouse assertion results found at ${MANIFEST_PATH}${COLORS.reset}`
    );
    console.error(
      'Run "npm run lighthouse" or otherwise produce .lighthouseci/assertion-results.json first'
    );
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
    const manifest = JSON.parse(raw);
    if (!manifest) {
      throw new Error("empty manifest");
    }
    return manifest;
  } catch (err) {
    console.error(
      `${COLORS.red}Error parsing ${MANIFEST_PATH}: ${err.message}${COLORS.reset}`
    );
    process.exit(1);
  }
}

function isAssertionFormat(manifest) {
  // Manifest is an array of assertion objects (or object with array property).
  if (Array.isArray(manifest)) {
    return (
      manifest.length > 0 &&
      manifest[0] &&
      typeof manifest[0].auditId !== "undefined"
    );
  }
  // Sometimes LHCI produces { assertions: [...] } shaped output
  if (manifest && Array.isArray(manifest.assertions)) {
    return (
      manifest.assertions.length > 0 &&
      typeof manifest.assertions[0].auditId !== "undefined"
    );
  }
  return false;
}

function displayAssertions(manifest) {
  const assertions = Array.isArray(manifest)
    ? manifest
    : manifest.assertions || [];
  // Group by URL
  const grouped = assertions.reduce((acc, a) => {
    const url = a.url || "unknown URL";
    acc[url] = acc[url] || [];
    acc[url].push(a);
    return acc;
  }, {});

  console.log(
    `\n${COLORS.bold}${COLORS.cyan}📋 Lighthouse CI Assertions${COLORS.reset}\n`
  );

  let hasError = false;
  let totalFailed = 0;
  let totalWarnings = 0;

  Object.entries(grouped).forEach(([url, items]) => {
    console.log(`${COLORS.bold}${url}${COLORS.reset}`);
    console.log("─".repeat(60));

    items.forEach((it) => {
      const passed = !!it.passed;
      // Determine level: prefer explicit level, else infer from passed
      const level = it.level || (passed ? "info" : "error");
      const isError = level === "error" || (!passed && level !== "warn");
      const isWarn = level === "warn";

      if (isError && !passed) {
        hasError = true;
        totalFailed++;
      } else if (isWarn && !passed) {
        totalWarnings++;
      }

      // Build message
      let title =
        it.auditTitle ||
        it.auditId ||
        it.message ||
        `<${it.name || "assertion"}>`;
      const status = passed
        ? `${COLORS.green}PASS${COLORS.reset}`
        : isWarn
        ? `${COLORS.yellow}WARN${COLORS.reset}`
        : `${COLORS.red}FAIL${COLORS.reset}`;

      console.log(` ${status}  ${COLORS.bold}${title}${COLORS.reset}`);
      if (it.auditId) {
        console.log(`   auditId: ${it.auditId}`);
      }
      if (it.message) {
        console.log(`   message: ${it.message}`);
      }
      if (
        typeof it.expected !== "undefined" ||
        typeof it.actual !== "undefined" ||
        Array.isArray(it.values)
      ) {
        console.log(`   expected: ${JSON.stringify(it.expected)}`);
        console.log(`   actual:   ${JSON.stringify(it.actual)}`);
        if (Array.isArray(it.values) && it.values.length) {
          console.log(`   values:   ${JSON.stringify(it.values)}`);
        }
        if (it.operator) console.log(`   operator: ${it.operator}`);
      }
      if (it.auditDocumentationLink) {
        console.log(`   docs: ${it.auditDocumentationLink}`);
      }
      console.log("");
    });

    console.log("\n");
  });

  console.log(
    `Summary: ${
      totalFailed > 0
        ? `${COLORS.red}${totalFailed} failed${COLORS.reset}`
        : `${COLORS.green}0 failed${COLORS.reset}`
    }, ${
      totalWarnings > 0
        ? `${COLORS.yellow}${totalWarnings} warnings${COLORS.reset}`
        : `${COLORS.green}0 warnings${COLORS.reset}`
    }\n`
  );
  return { hasError, totalFailed, totalWarnings };
}

function displayLHCIResults(results) {
  console.log(
    `\n${COLORS.bold}${COLORS.cyan}📊 Lighthouse CI Summary${COLORS.reset}\n`
  );

  let anyFailedThreshold = false;

  results.forEach((result, index) => {
    const url = result.url || `Result ${index + 1}`;
    console.log(`${COLORS.bold}${url}${COLORS.reset}`);
    console.log("─".repeat(60));

    if (result.summary) {
      console.log("\n📈 Category Scores:");
      console.log(
        `  Performance:    ${formatScore(result.summary.performance)}`
      );
      console.log(
        `  Accessibility:  ${formatScore(result.summary.accessibility)}`
      );
      console.log(
        `  Best Practices: ${formatScore(result.summary["best-practices"])}`
      );
      console.log(`  SEO:            ${formatScore(result.summary.seo)}`);
    }

    // Load full report for detailed metrics if available
    const reportPath = path.join(".lighthouseci", result.htmlPath || "");
    if (
      result.htmlPath &&
      fs.existsSync(
        path.join(".lighthouseci", result.htmlPath.replace(".html", ".json"))
      )
    ) {
      try {
        const reportJson = JSON.parse(
          fs.readFileSync(
            path.join(
              ".lighthouseci",
              result.htmlPath.replace(".html", ".json")
            ),
            "utf8"
          )
        );
        const metrics = reportJson.audits || {};

        console.log("\n⚡ Core Web Vitals:");
        if (metrics["first-contentful-paint"]) {
          console.log(
            `  FCP:  ${formatMetric(
              metrics["first-contentful-paint"].numericValue
            )}`
          );
        }
        if (metrics["largest-contentful-paint"]) {
          console.log(
            `  LCP:  ${formatMetric(
              metrics["largest-contentful-paint"].numericValue
            )}`
          );
        }
        if (metrics["total-blocking-time"]) {
          console.log(
            `  TBT:  ${formatMetric(
              metrics["total-blocking-time"].numericValue
            )}`
          );
        }
        if (metrics["cumulative-layout-shift"]) {
          console.log(
            `  CLS:  ${formatMetric(
              metrics["cumulative-layout-shift"].numericValue,
              ""
            )}`
          );
        }
        if (metrics["speed-index"]) {
          console.log(
            `  SI:   ${formatMetric(metrics["speed-index"].numericValue)}`
          );
        }

        // Count opportunities and diagnostics
        let opportunities = 0;
        let warnings = 0;
        Object.values(reportJson.audits).forEach((audit) => {
          if (audit.score !== null && audit.score < 1) {
            if (audit.details?.type === "opportunity") opportunities++;
            else warnings++;
          }
        });

        console.log("\n🔍 Issues Found:");
        console.log(
          `  Opportunities: ${
            opportunities > 0 ? COLORS.yellow : COLORS.green
          }${opportunities}${COLORS.reset}`
        );
        console.log(
          `  Warnings:      ${
            warnings > 0 ? COLORS.yellow : COLORS.green
          }${warnings}${COLORS.reset}`
        );
      } catch (err) {
        console.log(
          `  ${COLORS.yellow}(Detailed metrics unavailable)${COLORS.reset}`
        );
      }
    }

    if (result.htmlPath) {
      console.log(`\n📄 Full report: .lighthouseci/${result.htmlPath}`);
    }
    console.log("\n");
  });

  // Simple threshold check if summaries present
  const thresholds = {
    performance: 0.85,
    accessibility: 0.9,
    "best-practices": 0.85,
    seo: 0.9,
  };

  let failed = false;
  console.log(`${COLORS.bold}🎯 Threshold Check${COLORS.reset}\n`);
  results.forEach((result) => {
    if (!result.summary) return;
    Object.entries(thresholds).forEach(([category, threshold]) => {
      const score = result.summary[category];
      const passed = typeof score === "number" ? score >= threshold : false;
      if (!passed) {
        failed = true;
        console.log(
          ` ❌ ${category}: ${formatScore(score)} (required: ${Math.round(
            threshold * 100
          )})`
        );
      }
    });
  });

  if (!failed) {
    console.log(`${COLORS.green}✅ All thresholds passed!${COLORS.reset}\n`);
  } else {
    console.log(`\n${COLORS.red}❌ Some thresholds failed${COLORS.reset}\n`);
  }

  return !failed;
}

// NEW: Write badge JSON files for Shields.io
function writeBadgeJson(results) {
  const outDir = path.resolve("public_badges");
  fs.mkdirSync(outDir, { recursive: true });

  const thresholds = {
    performance: 0.85,
    accessibility: 0.9,
    "best-practices": 0.85,
    seo: 0.9,
  };

  const colorForScore = (score) => {
    if (score == null) return "lightgrey";
    if (score >= 0.9) return "brightgreen";
    if (score >= 0.75) return "green";
    if (score >= 0.5) return "yellow";
    if (score > 0) return "orange";
    return "red";
  };

  results.forEach((result) => {
    if (!result.summary) return;
    Object.entries(result.summary).forEach(([category, score]) => {
      if (typeof score !== "number") return;
      const percent = Math.round(score * 100);
      const badge = {
        schemaVersion: 1,
        label: `lighthouse-${category}`,
        message: `${percent}`,
        color: colorForScore(score),
      };
      const filename = `lighthouse-${category}.json`;
      fs.writeFileSync(
        path.join(outDir, filename),
        JSON.stringify(badge, null, 2)
      );
      console.log(`Wrote badge: ${filename} (${percent}%)`);
    });
  });
}

function main() {
  const manifest = loadManifest();

  // Determine format
  if (isAssertionFormat(manifest)) {
    // If the file contains only assertions, show assertion summary
    const { hasError } = displayAssertions(manifest);
    if (hasError) {
      console.log(
        `${COLORS.yellow}💡 Tip: Open the failing page(s) and inspect contrast / failing audits${COLORS.reset}`
      );
    } else {
      console.log(`${COLORS.green}✅ All assertions passed!${COLORS.reset}`);
    }
    process.exit(hasError ? 1 : 0);
  }

  // Otherwise treat manifest as LHCI result array (including older formats)
  const results = Array.isArray(manifest) ? manifest : manifest.results || [];
  if (!Array.isArray(results) || results.length === 0) {
    console.error(
      `${COLORS.red}Error: No recognizable LHCI results found in ${MANIFEST_PATH}${COLORS.reset}`
    );
    process.exit(1);
  }

  displayLHCIResults(results);
  writeBadgeJson(results); // NEW: write badge JSON files

  const thresholdsPassed = checkThresholdsWrapper(results);
  process.exit(thresholdsPassed ? 0 : 1);
}

// Separate threshold wrapper (keeps API similar to original)
function checkThresholdsWrapper(results) {
  const thresholds = {
    performance: 0.85,
    accessibility: 0.9,
    "best-practices": 0.85,
    seo: 0.9,
  };

  let failed = false;
  results.forEach((result) => {
    if (!result.summary) return;
    Object.entries(thresholds).forEach(([category, threshold]) => {
      const score = result.summary[category];
      if (typeof score !== "number" || score < threshold) {
        failed = true;
      }
    });
  });

  if (!failed) {
    console.log(`${COLORS.green}✅ All thresholds passed!${COLORS.reset}\n`);
  } else {
    console.log(`${COLORS.red}❌ Some thresholds failed${COLORS.reset}\n`);
  }

  return !failed;
}

if (require.main === module) {
  main();
}

module.exports = {
  loadManifest,
  isAssertionFormat,
  displayAssertions,
  displayLHCIResults,
  writeBadgeJson, // NEW export
};
