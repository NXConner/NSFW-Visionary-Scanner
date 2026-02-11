import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Landing page (anonymous)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("shows hero headline and primary actions", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Brand text varies by build profile; assert a visible hero heading exists.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /get started free/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i }).first()).toBeVisible();
  });
});
