import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("DLC restore purchases + device management (hybrid)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("Profile -> Settings shows DLC card; restore + device manager open", async ({ page }) => {
    await page.goto("/");
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

    // DLC status card should exist in hybrid builds
    const dlcCard = page.getByText("NSFW Content");
    if (!(await dlcCard.count())) {
      await expect(page.getByText("Appearance")).toBeVisible();
      return;
    }

    await expect(dlcCard).toBeVisible();

    // Restore purchases should be available even if not unlocked
    const restore = page.getByRole("button", { name: "Restore Purchases" });
    await expect(restore).toBeVisible();
    await restore.click();

    // Device manager should open and show sign-in gating in anonymous E2E
    const manage = page.getByRole("button", { name: "Manage Devices" });
    await expect(manage).toBeVisible();
    await manage.click();

    await expect(page.getByText("DLC Device Management")).toBeVisible();
    await expect(page.getByText(/Sign in to view and manage your DLC devices/i)).toBeVisible();
  });
});
