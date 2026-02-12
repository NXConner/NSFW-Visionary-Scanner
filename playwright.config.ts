import { defineConfig, devices } from "@playwright/test";

const DEFAULT_BASE_URL = "http://127.0.0.1:8080";
const baseURL = String(
  process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || DEFAULT_BASE_URL,
).trim();

const parsed = (() => {
  try {
    return new URL(baseURL);
  } catch {
    return null;
  }
})();

const isLocalHost = parsed
  ? ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)
  : false;

const startServer =
  (process.env.PLAYWRIGHT_START_SERVER || "1") !== "0" &&
  // Only auto-start a server for local URLs; remote targets should be managed externally.
  isLocalHost;

const serverHost =
  parsed?.hostname && parsed.hostname !== "0.0.0.0" ? parsed.hostname : "127.0.0.1";
const serverPort = Number(parsed?.port || "8080");

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",

  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  outputDir: "test-results/playwright",

  use: {
    baseURL,
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  webServer: startServer
    ? {
        command: `npx cross-env VITE_E2E=1 VITE_DISTRIBUTION_CHANNEL=direct npm run dev -- --host ${serverHost} --port ${serverPort}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
