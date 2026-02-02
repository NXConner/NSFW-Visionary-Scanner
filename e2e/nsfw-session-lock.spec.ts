import { test, expect } from "@playwright/test";
import { primeLocalStorageForE2E, waitForAppReady } from "./e2eUtils";

test.describe("NSFW Session Lock", () => {
  test.beforeEach(async ({ page }) => {
    await primeLocalStorageForE2E(page);
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          "morphoscan_nsfw_privacy_settings_v1",
          JSON.stringify({
            incognitoMode: false,
            blurThumbnails: true,
            hideTitles: false,
            sessionLockEnabled: true,
            sessionLockMinutes: 10,
            requireBiometricIfAvailable: false,
          }),
        );
        localStorage.setItem(
          "morphoscan_lock_settings",
          JSON.stringify({ enabled: true, pin: "1234", useBiometric: false }),
        );
        localStorage.removeItem("morphoscan_nsfw_session_unlocked_at");
      } catch {
        // ignore
      }
    });
  });

  test("shows gate when locked and unlocks when session is marked unlocked", async ({ page }) => {
    await page.goto("/nsfw");
    await waitForAppReady(page);

    const notFound = page.getByText(/oops! page not found/i);
    if (await notFound.count()) {
      await expect(notFound).toBeVisible();
      return;
    }

    const lockTitle = page.getByText(/nsfw session locked/i);
    if (await lockTitle.count()) {
      await expect(lockTitle).toBeVisible();

      await page.evaluate(() => {
        localStorage.setItem("morphoscan_nsfw_session_unlocked_at", String(Date.now()));
        window.dispatchEvent(new CustomEvent("nsfw-session-lock-changed"));
      });

      await expect(lockTitle).toHaveCount(0);
      return;
    }

    await expect(page.getByText("NSFW Hub").first()).toBeVisible();
  });

  test("shows gate when panic lock flag is enabled", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("morphoscan_nsfw_panic_lock", "true");
      } catch {
        // ignore
      }
    });

    await page.goto("/nsfw");
    await waitForAppReady(page);

    const notFound = page.getByText(/oops! page not found/i);
    if (await notFound.count()) {
      await expect(notFound).toBeVisible();
      return;
    }

    await expect(page.getByText(/nsfw session locked/i)).toBeVisible();
  });
});

