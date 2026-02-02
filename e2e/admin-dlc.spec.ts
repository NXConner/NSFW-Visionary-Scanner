import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Admin DLC (gated)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("non-admin should see admin-required message", async ({ page }) => {
    await page.goto("/admin/dlc");
    await waitForAppReady(page);

    await expect(page.getByText(/Admin access required/i)).toBeVisible();
  });
});
