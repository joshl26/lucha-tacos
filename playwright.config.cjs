const { devices } = require("@playwright/test");

module.exports = {
  testDir: "tests/e2e",
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/results.json" }], // ✅ Add this line
    ["junit", { outputFile: "playwright-junit.xml" }],
    ["html", { outputFolder: "playwright-report" }],
  ],
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1280, height: 720 } },
    },
    {
      name: "firefox",
      use: { browserName: "firefox", viewport: { width: 1280, height: 720 } },
    },
    {
      name: "webkit",
      use: { browserName: "webkit", viewport: { width: 1280, height: 720 } },
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:5500",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
};
