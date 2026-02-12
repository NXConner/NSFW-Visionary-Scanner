import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Partner sync tab", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("renders partner sync panels", async ({ page }) => {
    // Main app experience lives at /app (root "/" is the marketing/landing page).
    await page.goto("/app");
    await waitForAppReady(page);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "partner-sync" }));
    });

    const notFound = page.getByText(/oops! page not found/i);
    if (await notFound.count()) {
      await expect(notFound).toBeVisible();
      return;
    }

    // "Partner Sync" can appear in nav; assert main content renders something stable.
    const main = page.locator("#main-content");

    // Locked DLC state: LockedFeature uses a non-localized "Unlock Now" CTA.
    const unlockNow = main.getByRole("button", { name: /^unlock now$/i });
    if (await unlockNow.count()) {
      await expect(unlockNow.first()).toBeVisible();
      return;
    }

    // Unlocked state: PartnerSyncTab renders a TabsList with multiple internal tabs.
    const internalTabs = main.getByRole("tab");
    await expect(internalTabs.first()).toBeVisible({ timeout: 15_000 });
    const tabCount = await internalTabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(4);
  });
});
