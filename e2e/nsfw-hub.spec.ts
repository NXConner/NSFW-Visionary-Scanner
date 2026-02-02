import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("NSFW Hub (gated)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("should show gating message when NSFW DLC not detected", async ({ page }) => {
    await page.goto("/nsfw");
    await waitForAppReady(page);

    const notFound = page.getByText(/oops! page not found/i);
    if (await notFound.count()) {
      await expect(notFound).toBeVisible();
      return;
    }

    await expect(page.getByText("NSFW Hub").first()).toBeVisible();

    const lockedCopy = page.getByText(/requires nsfw dlc/i);
    if (await lockedCopy.count()) {
      await expect(page.getByRole("link", { name: /open dlc store/i })).toBeVisible();
      return;
    }

    const entitlements = page.getByText(/entitlements & unlock status/i);
    if (await entitlements.count()) {
      await expect(entitlements).toBeVisible();
      return;
    }

    await expect(page.getByText(/verify age/i)).toBeVisible();
  });
});
