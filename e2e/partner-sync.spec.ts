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

    await expect(page.getByText("Partner Sync")).toBeVisible();
    const thoughtTab = page.getByRole("tab", { name: "Thought Pings" });
    if (await thoughtTab.count()) {
      await expect(thoughtTab).toBeVisible();
      await expect(page.getByRole("tab", { name: "Date Nights" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Positions" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Settings" })).toBeVisible();
      return;
    }

    await expect(page.getByText(/unlock partner sync/i)).toBeVisible();
  });
});
