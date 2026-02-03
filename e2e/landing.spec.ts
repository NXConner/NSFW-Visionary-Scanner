import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Landing page (anonymous)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("shows hero headline and primary actions", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    await expect(page.getByRole("heading", { name: /morphoscan/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /get started free/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
