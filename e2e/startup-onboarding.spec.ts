import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./e2eUtils";

test.describe("Startup + onboarding (first run)", () => {
  test.beforeEach(async ({ page }) => {
    // Simulate a real first launch (no primed keys).
    await page.addInitScript(() => {
      try {
        // Onboarding + disclaimer
        localStorage.removeItem("morphoscan_onboarding_complete");
        localStorage.removeItem("morphoscan_disclaimer_accepted");
        localStorage.removeItem("morphoscan_disclaimer_date");

        // NSFW/DLC/consent related keys that can affect first-run UX.
        localStorage.removeItem("dlc_age_verified_v1");
        localStorage.removeItem("morphoscan_nsfw_privacy_settings_v1");
        localStorage.removeItem("morphoscan_nsfw_session_unlocked_at");
        localStorage.removeItem("morphoscan_nsfw_panic_lock");
      } catch {
        // ignore
      }
    });
  });

  test("boots, completes onboarding, then accepts the first-launch disclaimer in /app", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppReady(page, 90_000);

    // Loader should be removed once React mounts (AppContent handles this).
    await expect(page.locator("#app-loader")).toHaveCount(0, { timeout: 15_000 });

    // Onboarding should appear on first launch.
    const skip = page.getByRole("button", { name: "Skip onboarding" });
    await expect(skip).toBeVisible({ timeout: 20_000 });

    // Step 1 title should contain "Welcome to ..."
    await expect(page.getByRole("heading", { level: 2, name: /welcome to/i })).toBeVisible();

    // Advance through the wizard quickly.
    // (Do not assume exact step count; keep robust to content tweaks.)
    for (let i = 0; i < 12; i++) {
      const getStarted = page.getByRole("button", { name: /^Get Started$/i });
      if (await getStarted.isVisible().catch(() => false)) {
        await getStarted.click();
        break;
      }

      const next = page.getByRole("button", { name: /^Next$/i });
      await expect(next).toBeVisible({ timeout: 10_000 });
      await next.click();
    }

    await expect(skip).toHaveCount(0, { timeout: 20_000 });

    // Verify onboarding completion persisted.
    await expect
      .poll(async () => {
        return await page.evaluate(() => localStorage.getItem("morphoscan_onboarding_complete"));
      })
      .toBe("true");

    // Main app route should show the first-launch medical disclaimer modal.
    await page.goto("/app");
    await waitForAppReady(page, 90_000);

    // Target the modal dialog specifically; "Medical Disclaimer" text may appear elsewhere.
    const disclaimerDialog = page.getByRole("dialog", { name: /medical disclaimer/i });
    await expect(disclaimerDialog).toBeVisible({ timeout: 20_000 });

    // Accept requires checking the acknowledgement checkbox first.
    const acknowledgeLabel = page.getByText("I understand and acknowledge this disclaimer");
    await acknowledgeLabel.scrollIntoViewIfNeeded();
    await acknowledgeLabel.click();

    const accept = page.getByRole("button", { name: /I Understand/i });
    await expect(accept).toBeEnabled({ timeout: 10_000 });
    await accept.click();

    // Radix Dialog may remain mounted but hidden after close; assert it's not visible.
    await expect(disclaimerDialog).not.toBeVisible({ timeout: 20_000 });

    // App shell should be usable after closing disclaimer.
    await expect(page.getByRole("button", { name: /^Scan$/ })).toBeVisible({ timeout: 20_000 });
  });
});
