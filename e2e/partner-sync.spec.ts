import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Partner sync tab", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("renders partner sync panels", async ({ page }) => {
    // Main interactive app lives under /app (root "/" is the marketing landing page).
    await page.goto("/app");
    await waitForAppReady(page);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "partner-sync" }));
    });

    // Partner Sync renders inside Progress -> Video in the current app architecture.
    await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible({ timeout: 15_000 });

    const thoughtTab = page.getByRole("tab", { name: "Thought Pings" });
    if (await thoughtTab.count()) {
      await thoughtTab.first().scrollIntoViewIfNeeded();
      await expect(thoughtTab.first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("tab", { name: "Date Nights" }).first()).toBeVisible();
      await expect(page.getByRole("tab", { name: "Positions" }).first()).toBeVisible();
      await expect(page.getByRole("tab", { name: "Settings" }).first()).toBeVisible();
      return;
    }

    // Locked state: either the descriptive copy or the generic locked CTA.
    const lockedCopy = page.getByText(/unlock partner sync/i);
    if (await lockedCopy.count()) {
      await lockedCopy.first().scrollIntoViewIfNeeded();
      await expect(lockedCopy.first()).toBeVisible({ timeout: 15_000 });
      return;
    }

    await expect(page.getByRole("button", { name: /unlock now/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
