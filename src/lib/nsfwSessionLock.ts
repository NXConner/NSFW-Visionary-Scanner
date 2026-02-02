import type { NsfwPrivacySettings } from "./nsfwPrivacySettings";
import { appendAuditLogEntry } from "@/lib/auditLogStorage";

const UNLOCKED_AT_KEY = "morphoscan_nsfw_session_unlocked_at";
const PANIC_LOCK_KEY = "morphoscan_nsfw_panic_lock";

function nowMs(): number {
  return Date.now();
}

export function readNsfwUnlockedAtMs(): number | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(UNLOCKED_AT_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function markNsfwSessionUnlocked(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(UNLOCKED_AT_KEY, String(nowMs()));
    window.dispatchEvent(new CustomEvent("nsfw-session-lock-changed"));
  } catch {
    // ignore
  }
}

export function clearNsfwSessionUnlocked(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(UNLOCKED_AT_KEY);
    window.dispatchEvent(new CustomEvent("nsfw-session-lock-changed"));
  } catch {
    // ignore
  }
}

export function isNsfwPanicLocked(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PANIC_LOCK_KEY) === "true";
  } catch {
    return false;
  }
}

export function setNsfwPanicLock(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PANIC_LOCK_KEY, "true");
    clearNsfwSessionUnlocked();
    window.dispatchEvent(new CustomEvent("nsfw-session-lock-changed"));
  } catch {
    // ignore
  }
}

export function triggerNsfwPanicExit(params?: { reason?: string }): void {
  setNsfwPanicLock();
  clearNsfwSessionUnlocked();
  void appendAuditLogEntry({
    action: "nsfw_panic_exit",
    category: "nsfw",
    details: params?.reason || "User triggered panic exit",
  });
}

export function clearNsfwPanicLock(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PANIC_LOCK_KEY);
    window.dispatchEvent(new CustomEvent("nsfw-session-lock-changed"));
  } catch {
    // ignore
  }
}

export function isNsfwSessionLocked(settings: NsfwPrivacySettings): boolean {
  if (isNsfwPanicLocked()) return true;
  if (!settings.sessionLockEnabled) return false;
  const unlockedAt = readNsfwUnlockedAtMs();
  if (!unlockedAt) return true;
  const ttlMs = Math.max(1, Math.min(120, settings.sessionLockMinutes)) * 60_000;
  return nowMs() - unlockedAt > ttlMs;
}
