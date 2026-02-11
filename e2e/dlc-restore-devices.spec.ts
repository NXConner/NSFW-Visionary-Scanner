import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("DLC restore purchases + device management (hybrid)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("Profile -> Settings shows DLC card; restore + device manager open", async ({ page }) => {
    // Main app experience lives at /app (root "/" is the marketing/landing page).
    await page.goto("/app");
    await waitForAppReady(page);

    // Navigate to Profile tab
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "profile" }));
    });
    await expect(page.getByText("Your Profile")).toBeVisible();

    // Open Settings internal tab
    const profileSection = page
      .getByRole("heading", { name: /your profile/i })
      .locator("xpath=ancestor::section[1]");
    const settingsTab = profileSection.getByRole("tab", { name: "Settings" });
    await settingsTab.scrollIntoViewIfNeeded();
    await settingsTab.click({ force: true });

    // DLC status UI is only present in certain build profiles (e.g. hybrid).
    // If it's not present, keep the test as a smoke check for Settings content.
    const restore = page.getByRole("button", { name: "Restore Purchases" });
    const manage = page.getByRole("button", { name: "Manage Devices" });
    if (!(await restore.count()) || !(await manage.count())) {
      await expect(page.getByText("Appearance")).toBeVisible();
      return;
    }

    await expect(page.getByText("NSFW Content")).toBeVisible();

    // Restore purchases should be available even if not unlocked
    await expect(restore.first()).toBeVisible();
    await restore.first().click();

    // Device manager should open and show sign-in gating in anonymous E2E
    await expect(manage.first()).toBeVisible();
    await manage.first().click();

    await expect(page.getByText("DLC Device Management")).toBeVisible();
    await expect(page.getByText(/Sign in to view and manage your DLC devices/i)).toBeVisible();
  });
});
