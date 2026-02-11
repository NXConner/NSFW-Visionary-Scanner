import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  clearNsfwPanicLock,
  isNsfwPanicLocked,
  isNsfwSessionLocked,
  markNsfwSessionUnlocked,
  triggerNsfwPanicExit,
} from "@/lib/nsfwSessionLock";
import { DEFAULT_NSFW_PRIVACY_SETTINGS } from "@/lib/nsfwPrivacySettings";

const appendAuditLogEntry = vi.fn(async (_payload: unknown) => null);

vi.mock("@/lib/auditLogStorage", () => ({
  appendAuditLogEntry: (payload: unknown) => appendAuditLogEntry(payload),
}));

describe("nsfwSessionLock", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("triggers panic exit, clears unlock, and logs audit entry", () => {
    markNsfwSessionUnlocked();
    expect(localStorage.getItem("morphoscan_nsfw_session_unlocked_at")).not.toBeNull();

    triggerNsfwPanicExit({ reason: "test" });

    expect(isNsfwPanicLocked()).toBe(true);
    expect(localStorage.getItem("morphoscan_nsfw_session_unlocked_at")).toBeNull();
    expect(appendAuditLogEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "nsfw_panic_exit",
        category: "nsfw",
        details: "test",
      }),
    );
  });

  it("keeps session locked when panic lock is active", () => {
    triggerNsfwPanicExit();
    const settings = {
      ...DEFAULT_NSFW_PRIVACY_SETTINGS,
      sessionLockEnabled: false,
    };
    expect(isNsfwSessionLocked(settings)).toBe(true);
  });

  it("respects session lock settings when panic lock is cleared", () => {
    triggerNsfwPanicExit();
    clearNsfwPanicLock();
    const settings = {
      ...DEFAULT_NSFW_PRIVACY_SETTINGS,
      sessionLockEnabled: false,
    };
    expect(isNsfwSessionLocked(settings)).toBe(false);
  });
});
