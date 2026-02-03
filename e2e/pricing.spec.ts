import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("Pricing page (anonymous)", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
  });

  test("shows sign-in prompt and plan headline", async ({ page }) => {
    page.on("pageerror", error => {
      console.error("PAGEERROR:", error.message);
      if (error.stack) {
        console.error("PAGEERROR_STACK:", error.stack);
      }
    });
    page.on("console", msg => {
      if (msg.type() === "error") {
        const location = msg.location();
        const locationSuffix = location.url
          ? ` (${location.url}:${location.lineNumber}:${location.columnNumber})`
          : "";
        console.error("CONSOLE:", `${msg.text()}${locationSuffix}`);
      }
    });
    page.on("requestfailed", request => {
      const failure = request.failure();
      console.error(
        "REQUESTFAILED:",
        request.url(),
        failure?.errorText ? `(${failure.errorText})` : "",
      );
    });

    await page.goto("/pricing");
    await waitForAppReady(page);

    await expect(page.getByRole("heading", { name: /choose your plan/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in to get started/i })).toBeVisible();
  });
});
