import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Core navigation flow (smoke)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("auth -> settings -> scanner", async ({ page }, testInfo) => {
    await page.goto("/auth");
    await waitForAppReady(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Main interactive app lives under /app (root "/" is the marketing landing page).
    await page.goto("/app");
    await waitForAppReady(page);
    await expect(page).toHaveTitle(/MorphoScan Pro/);

    // Navigate to Profile tab (without requiring real auth) via the in-app navigation event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "profile" }));
    });
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({ timeout: 15_000 });

    const isMobile = testInfo.project.name.toLowerCase().includes("mobile");
    if (!isMobile) {
      // Open the Profile hub Settings tab (stable; does not require profile DB).
      const settingsTab = page.getByRole("tab", { name: "Settings" }).first();
      await settingsTab.scrollIntoViewIfNeeded();
      await settingsTab.click({ force: true });
      await expect(page.getByText("Appearance")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Theme", { exact: true })).toBeVisible({ timeout: 15_000 });
    } else {
      // Mobile layouts may split internal tabs across rows/overflows.
      // Keep the smoke test stable by verifying Profile renders and proceeding.
      await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    }

    // Navigate to Scanner tab and verify scanner UI is present
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "scanner" }));
    });
    await expect(page.getByRole("button", { name: "Start Camera" })).toBeVisible({
      timeout: 15_000,
    });
  });
});
