import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Pricing page (anonymous)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("shows sign-in prompt and plan headline", async ({ page }) => {
    await page.goto("/pricing");
    await waitForAppReady(page);

    await expect(page.getByRole("heading", { name: /choose your plan/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in to get started/i })).toBeVisible();
  });
});
