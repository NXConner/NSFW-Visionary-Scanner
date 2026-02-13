import { defineConfig, devices } from "@playwright/test";

const FULL_MATRIX = process.env.E2E_FULL === "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: "DontNeed/generated/test-results",
  reporter: [["html", { outputFolder: "DontNeed/generated/playwright-report", open: "never" }]],
  expect: {
    timeout: 30_000,
  },
  use: {
    // Use IPv4 loopback to avoid localhost IPv6 resolution issues in CI/containers.
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Hardening for PWA/WebKit flakiness:
    // - avoid service worker caching during E2E
    serviceWorkers: "block",
  },
  // Default to Chromium for speed/stability; run full matrix with E2E_FULL=1.
  projects: FULL_MATRIX
    ? [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
        { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
        { name: "Mobile Safari", use: { ...devices["iPhone 12"] } },
      ]
    : [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Ensure preview server can start in clean environments (requires build output).
    // If you already have the dev/preview server running, Playwright will reuse it.
    // Use a true SPA static server with history fallback for client-side routes.
    command: "npm run build && npx sirv-cli dist --single --port 4173 --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "production",
    },
  },
});
