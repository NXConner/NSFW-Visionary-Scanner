import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { NsfwPrivacyControlsCard } from "@/components/settings/panels/NsfwPrivacyControlsCard";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const PRIVACY_KEY = "morphoscan_nsfw_privacy_settings_v1";
const UNLOCKED_AT_KEY = "morphoscan_nsfw_session_unlocked_at";

describe("NsfwPrivacyControlsCard", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      PRIVACY_KEY,
      JSON.stringify({
        incognitoMode: false,
        blurThumbnails: true,
        hideTitles: false,
        sessionLockEnabled: true,
        sessionLockMinutes: 10,
        requireBiometricIfAvailable: false,
      }),
    );
  });

  it("locks the NSFW session when clicking Lock now", () => {
    localStorage.setItem(UNLOCKED_AT_KEY, String(Date.now()));
    render(<NsfwPrivacyControlsCard />);

    expect(localStorage.getItem(UNLOCKED_AT_KEY)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /lock now/i }));
    expect(localStorage.getItem(UNLOCKED_AT_KEY)).toBeNull();
  });
});
