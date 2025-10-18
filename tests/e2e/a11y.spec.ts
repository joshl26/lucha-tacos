// tests/e2e/a11y.spec.ts
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

test("Home page accessibility (axe) via direct injection", async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/");

  // inject axe script
  await page.addScriptTag({ path: axePath });

  // run axe in the page context
  const raw = await page.evaluate(async () => {
    // @ts-ignore
    return await (window as any).axe.run();
  });

  const outDir = path.join(process.cwd(), "test-results");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "axe-home.json"),
    JSON.stringify(raw, null, 2)
  );

  const violations = raw.violations || [];
  const blocking = violations.filter(
    (v: any) => v.impact === "critical" || v.impact === "serious"
  );
  expect(
    blocking.length,
    `Accessibility serious/critical violations: ${blocking.length}`
  ).toBe(0);
});
