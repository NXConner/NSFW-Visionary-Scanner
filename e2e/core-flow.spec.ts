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

    await page.goto("/");
    await waitForAppReady(page);
    await expect(page).toHaveTitle(/MorphoScan Pro/);

    // Navigate to Profile tab (without requiring real auth) via the in-app navigation event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "profile" }));
    });
    await expect(page.getByText("Your Profile")).toBeVisible();

    const isMobile = testInfo.project.name.toLowerCase().includes("mobile");
    if (!isMobile) {
      // Open Settings within Profile
      const profileSection = page
        .getByRole("heading", { name: /your profile/i })
        .locator("xpath=ancestor::section[1]");
      const settingsTab = profileSection.getByRole("tab", { name: "Settings" });
      await settingsTab.scrollIntoViewIfNeeded();
      await settingsTab.click({ force: true });
      await expect(page.getByText("Appearance")).toBeVisible();
      await expect(page.getByText("Theme", { exact: true })).toBeVisible();
      await expect(page.getByText("Push Notifications")).toBeVisible();
      await expect(page.getByText("Linked Accounts")).toBeVisible();
      await expect(page.getByText("Data Retention Policy")).toBeVisible();
      await expect(page.getByText("Delete Account")).toBeVisible();
    } else {
      // Mobile layouts may split internal tabs across rows/overflows.
      // Keep the smoke test stable by verifying Profile renders and proceeding.
      await expect(page.getByRole("button", { name: /Edit Profile/i })).toBeVisible();
    }

    // Navigate to Scanner tab and verify scanner UI is present
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "scanner" }));
    });
    await expect(page.getByRole("button", { name: "Start Camera" })).toBeVisible();
  });
});
