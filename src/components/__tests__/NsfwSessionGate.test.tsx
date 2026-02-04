import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// NsfwSessionGate reads super-admin bypass from AuthContext.
// Tests here validate lock behavior, not auth wiring, so we mock AuthContext.
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isSuperAdmin: false,
    hasFullAccess: false,
    allFeaturesUnlocked: false,
    loading: false,
    rolesLoading: false,
  }),
}));

vi.mock("@/hooks/useUserRoles", () => ({
  useUserRoles: () => ({
    isAdmin: false,
    isSuperAdmin: false,
    isLoading: false,
  }),
}));

// Make OTP input testable (avoid dealing with slot internals)
vi.mock("@/components/ui/input-otp", () => ({
  InputOTP: (props: any) => (
    <input
      aria-label="otp"
      value={props.value ?? ""}
      onChange={e => props.onChange?.((e.target as HTMLInputElement).value)}
    />
  ),
  InputOTPGroup: (props: any) => <div>{props.children}</div>,
  InputOTPSlot: () => null,
}));

const PRIVACY_KEY = "morphoscan_nsfw_privacy_settings_v1";
const APP_LOCK_KEY = "morphoscan_lock_settings";
const UNLOCKED_AT_KEY = "morphoscan_nsfw_session_unlocked_at";

describe("NsfwSessionGate", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("blocks content when session is locked and unlocks with PIN", async () => {
    vi.doMock("@/hooks/useBiometricAuth", () => ({
      useBiometricAuth: () => ({
        isAvailable: false,
        settings: { enabled: false },
        authenticate: vi.fn(async () => false),
        isLoading: false,
      }),
    }));

    const { NsfwSessionGate } = await import("@/components/nsfw/NsfwSessionGate");

    localStorage.setItem(
      PRIVACY_KEY,
      JSON.stringify({
        sessionLockEnabled: true,
        sessionLockMinutes: 10,
        requireBiometricIfAvailable: false,
      }),
    );
    localStorage.setItem(
      APP_LOCK_KEY,
      JSON.stringify({ enabled: true, pin: "1234", useBiometric: false }),
    );
    localStorage.removeItem(UNLOCKED_AT_KEY);

    render(
      <NsfwSessionGate>
        <div>secret</div>
      </NsfwSessionGate>,
    );

    expect(screen.getByText(/nsfw session locked/i)).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("otp"), { target: { value: "1234" } });

    await waitFor(() => {
      expect(screen.getByText("secret")).toBeInTheDocument();
    });
  });

  it("requires biometric when requireBiometricIfAvailable is enabled and biometric is available", async () => {
    vi.doMock("@/hooks/useBiometricAuth", () => ({
      useBiometricAuth: () => ({
        isAvailable: true,
        settings: { enabled: true },
        authenticate: vi.fn(async () => true),
        isLoading: false,
      }),
    }));

    const { NsfwSessionGate } = await import("@/components/nsfw/NsfwSessionGate");

    localStorage.setItem(
      PRIVACY_KEY,
      JSON.stringify({
        sessionLockEnabled: true,
        sessionLockMinutes: 10,
        requireBiometricIfAvailable: true,
      }),
    );
    localStorage.setItem(
      APP_LOCK_KEY,
      JSON.stringify({ enabled: true, pin: "1234", useBiometric: true }),
    );
    localStorage.removeItem(UNLOCKED_AT_KEY);

    render(
      <NsfwSessionGate>
        <div>secret</div>
      </NsfwSessionGate>,
    );

    expect(screen.getByText(/biometric unlock is required/i)).toBeInTheDocument();
    expect(screen.queryByText(/enter app pin/i)).not.toBeInTheDocument();
  });
});
