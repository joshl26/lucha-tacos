// lighthouserc.js
// Configuration for Lighthouse CI automated testing

module.exports = {
  ci: {
    collect: {
      // Static site - serve from current directory
      staticDistDir: "./",

      // URLs to test - adjust based on your site structure
      url: [
        "http://localhost/index.html",
        "http://localhost/order/index.html",
        "http://localhost/about/index.html",
        "http://localhost/privacy/index.html",
      ],

      // Number of runs per URL (median is used)
      numberOfRuns: 3,

      // Lighthouse settings
      settings: {
        // Test desktop by default (can override in CI)
        preset: "desktop",

        // Throttling settings for consistent results
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },

        // Skip certain audits if needed
        skipAudits: [
          // 'uses-http2', // Skip if not applicable
        ],
      },
    },

    assert: {
      // Minimum acceptable scores
      assertions: {
        "categories:performance": ["error", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.85 }],
        "categories:seo": ["error", { minScore: 0.9 }],

        // Specific important audits
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],

        // Accessibility specifics
        "color-contrast": "error",
        "image-alt": "error",
        label: "error",
        "valid-lang": "error",

        // Best practices
        "uses-https": "off", // Turn off for local testing
        "no-vulnerable-libraries": "warn",
      },
    },

    upload: {
      // Store results temporarily (no server setup needed)
      target: "temporary-public-storage",

      // Optional: Configure your own LHCI server
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },

    server: {
      // If running your own LHCI server
      // port: 9001,
      // storage: {
      //   storageMethod: 'sql',
      //   sqlDialect: 'sqlite',
      //   sqlDatabasePath: './lhci-data.db',
      // },
    },
  },
};
