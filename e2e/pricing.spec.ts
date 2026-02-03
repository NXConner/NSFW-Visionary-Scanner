import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Pricing page (anonymous)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("shows sign-in prompt and plan headline", async ({ page }) => {
    page.on("pageerror", error => {
      console.error("PAGEERROR:", error.message);
    });
    page.on("console", msg => {
      if (msg.type() === "error") {
        console.error("CONSOLE:", msg.text());
      }
    });

    await page.goto("/pricing");
    await waitForAppReady(page);

    await expect(page.getByRole("heading", { name: /choose your plan/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in to get started/i })).toBeVisible();
  });
});
