import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Core navigation flow (smoke)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("auth -> settings -> scanner", async ({ page }) => {
    await page.goto("/auth");
    await waitForAppReady(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Main interactive app lives under /app (root "/" is the marketing landing page).
    // Deep-link straight into the Profile hub Settings tab to keep the smoke test stable.
    await page.goto("/app?tab=settings");
    await waitForAppReady(page);
    await expect(page).toHaveTitle(/MorphoScan Pro/);

    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Appearance")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Theme", { exact: true })).toBeVisible({ timeout: 20_000 });

    // Navigate to Scanner tab and verify scanner UI is present
    await page.goto("/app?tab=scanner");
    await waitForAppReady(page);
    await expect(page.getByRole("button", { name: "Start Camera" })).toBeVisible({
      timeout: 20_000,
    });
  });
});
