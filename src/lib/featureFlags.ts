/**
 * Feature Flags System
 * Manages app version detection and feature availability
 * Integrated with DLC system for dynamic feature unlocking
 */

import { getLastKnownUserId, getPersistedRolesForUser } from "@/lib/auth/rolesCache";
import { logger } from "@/lib/logger";

export type AppVersion = "sfw" | "nsfw" | "hybrid";

/**
 * Get the current app version from environment variable
 */
export const getAppVersion = (): AppVersion => {
  const version = import.meta.env.VITE_APP_VERSION || "nsfw";
  if (version === "sfw" || version === "nsfw" || version === "hybrid") {
    return version;
  }
  // Default to nsfw for this repo (direct distribution)
  return "nsfw";
};

/**
 * Check if app is SFW version
 */
export const isSFW = (): boolean => {
  return getAppVersion() === "sfw";
};

/**
 * Check if app is NSFW version
 */
export const isNSFW = (): boolean => {
  return getAppVersion() === "nsfw";
};

/**
 * Check if app is hybrid version (SFW base + DLC unlockable)
 */
export const isHybrid = (): boolean => {
  return getAppVersion() === "hybrid";
};

/**
 * Get distribution channel (store or direct)
 */
export const getDistributionChannel = (): "store" | "direct" => {
  // Check if app was installed from store
  // This can be determined by checking app metadata or build configuration
  const channel = import.meta.env.VITE_DISTRIBUTION_CHANNEL || "direct";
  return channel === "store" ? "store" : "direct";
};

/**
 * Check if app is from store
 */
export const isStoreVersion = (): boolean => {
  return getDistributionChannel() === "store";
};

/**
 * Check if app is direct download
 */
export const isDirectVersion = (): boolean => {
  return getDistributionChannel() === "direct";
};

/**
 * Detect whether we're running on a Lovable-hosted domain.
 * Used to enforce stricter content policies for lovable.dev hosting.
 */
export const isLovableHost = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    const hostname = String(window.location.hostname || "").toLowerCase();
    return (
      hostname.includes("lovable") ||
      hostname.endsWith(".lovableproject.com") ||
      hostname.endsWith(".lovable.dev") ||
      hostname.endsWith(".lovable.app")
    );
  } catch {
    return false;
  }
};

const CONTENT_POLICY_OVERRIDE_KEY = "morphoscan_content_policy_override";
const SUPER_ADMIN_STORAGE_KEY = "lovable_super_admin_status";

export type ContentPolicy = "lovable" | "direct";

export const getContentPolicyOverride = (): ContentPolicy | null => {
  try {
    if (typeof window === "undefined") return null;
    const raw = String(window.localStorage.getItem(CONTENT_POLICY_OVERRIDE_KEY) || "")
      .toLowerCase()
      .trim();
    if (raw === "lovable" || raw === "direct") return raw;
    return null;
  } catch {
    return null;
  }
};

export const setContentPolicyOverride = (policy: ContentPolicy): void => {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CONTENT_POLICY_OVERRIDE_KEY, policy);
  } catch {
    // ignore
  } finally {
    try {
      window.dispatchEvent(new CustomEvent("content-policy-override-changed"));
    } catch {
      // ignore
    }
  }
};

export const clearContentPolicyOverride = (): void => {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CONTENT_POLICY_OVERRIDE_KEY);
  } catch {
    // ignore
  } finally {
    try {
      window.dispatchEvent(new CustomEvent("content-policy-override-changed"));
    } catch {
      // ignore
    }
  }
};

/**
 * "Lovable-safe mode" policy switch.
 *
 * - If `VITE_CONTENT_POLICY` is set to `lovable` or `direct`, it wins.
 * - Otherwise, default to strict mode for store builds and when hosted on Lovable domains.
 */
export const isLovablePolicyBuild = (): boolean => {
  // Hard constraints: store builds and lovable-hosted deployments must always be "lovable-safe".
  // This prevents hidden toggles from changing compliance posture in those environments.
  if (isStoreVersion() || isLovableHost()) return true;

  // Admin/dev override (direct builds only)
  const override = getContentPolicyOverride();
  if (override === "lovable") return true;
  if (override === "direct") return false;

  const forced = String(import.meta.env.VITE_CONTENT_POLICY || "")
    .toLowerCase()
    .trim();
  if (forced === "lovable") return true;
  if (forced === "direct") return false;

  // Default for non-store, non-lovable hosting is direct.
  return false;
};

/**
 * Whether adult-only surfaces should be enabled in the UI.
 * Default: OFF for store + lovable hosting.
 */
export const isAdultContentEnabled = (): boolean => {
  if (isLovablePolicyBuild()) return false;
  // Admin/super-admin should always have adult access in NSFW builds.
  if (hasAdminRoleOverride()) return true;
  // Adult surfaces are only intended for NSFW or hybrid builds (direct distribution).
  return isNSFW() || isHybrid();
};

/**
 * Check if NSFW content should be available (async for hybrid DLC checks).
 */
export const hasNSFWContent = async (): Promise<boolean> => {
  if (isLovablePolicyBuild()) return false;
  if (hasAdminRoleOverride()) return true;

  const version = getAppVersion();
  if (version === "nsfw") return true;
  if (version === "sfw") return false;

  // Hybrid version - check DLC license
  if (version === "hybrid") {
    try {
      const { hasDLCLicense } = await import("./dlcManager");
      return await hasDLCLicense();
    } catch (error) {
      logger.warn("DLC manager not available, NSFW content disabled", { error });
      return false;
    }
  }

  return false;
};

/**
 * Check if a specific feature is available
 */
export const isFeatureAvailable = async (feature: string): Promise<boolean> => {
  // Positions Gallery is NSFW-only
  if (feature === "positionsGallery") {
    return await hasNSFWContent();
  }

  // Visual content system is NSFW-only
  if (feature === "visualContent" || feature === "visualContentSystem") {
    return await hasNSFWContent();
  }

  // All other features are available in all versions
  return true;
};

/**
 * Get feature flags configuration
 */
export const getFeatureFlags = (): Record<string, boolean> => {
  const flags = import.meta.env.VITE_FEATURE_FLAGS || "";
  const flagMap: Record<string, boolean> = {};

  if (flags) {
    flags.split(",").forEach(flag => {
      const [key, value] = flag.split("=");
      if (key) {
        flagMap[key.trim()] = value !== "false";
      }
    });
  }

  return flagMap;
};

const FEATURE_FLAG_OVERRIDE_KEY = "morphoscan_feature_flag_overrides";

export type FeatureFlagOverrides = Record<string, boolean>;

const isBrowser = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

// Fallback for environments where localStorage is unavailable (quota, privacy mode, sandboxed iframes, etc.)
let volatileOverrides: FeatureFlagOverrides = {};

type StoredSuperAdmin = { userId?: string | null; isSuperAdmin?: boolean } | null;

const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const getStoredRoles = (): string[] => {
  // IMPORTANT: Only trust roles that match the last known user id.
  // This prevents stale privileged access when switching accounts without a clean sign-out.
  return getPersistedRolesForUser(getLastKnownUserId());
};

const isSuperAdminPersisted = (): boolean => {
  if (!isBrowser()) return false;
  const parsed = parseJson<StoredSuperAdmin>(
    window.localStorage.getItem(SUPER_ADMIN_STORAGE_KEY),
    null,
  );
  return Boolean(parsed && parsed.isSuperAdmin === true);
};

const hasAdminRoleOverride = (): boolean => {
  const roles = getStoredRoles();
  if (roles.includes("admin") || roles.includes("super_admin")) return true;
  return isSuperAdminPersisted();
};

const readOverrides = (): FeatureFlagOverrides => {
  if (!isBrowser()) return {};

  // If localStorage is blocked (privacy mode/sandbox), fall back to in-memory overrides.
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(FEATURE_FLAG_OVERRIDE_KEY);
  } catch {
    return volatileOverrides;
  }

  if (!raw) return {};

  // If storage exists but is corrupted/invalid JSON, treat as empty (do not "revive" volatile overrides).
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return {};
  }

  if (!parsed || typeof parsed !== "object") return {};
  const result: FeatureFlagOverrides = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === "boolean") result[k] = v;
  }
  return result;
};

const writeOverrides = (next: FeatureFlagOverrides) => {
  if (!isBrowser()) return;
  // Always update in-memory first so UI changes immediately even if persistence fails.
  volatileOverrides = { ...next };
  try {
    window.localStorage.setItem(FEATURE_FLAG_OVERRIDE_KEY, JSON.stringify(next));
  } catch {
    // Persistence is best-effort; some environments block localStorage writes.
  } finally {
    // Still notify subscribers (same-tab updates rely on this).
    window.dispatchEvent(new CustomEvent("feature-flag-overrides-changed"));
  }
};

export const getFeatureFlagOverrides = (): FeatureFlagOverrides => readOverrides();

export const getFeatureFlagOverride = (flag: string): boolean | undefined => {
  const overrides = readOverrides();
  return typeof overrides[flag] === "boolean" ? overrides[flag] : undefined;
};

export const setFeatureFlagOverride = (flag: string, enabled: boolean) => {
  const overrides = readOverrides();
  overrides[flag] = enabled;
  writeOverrides(overrides);
};

export const clearFeatureFlagOverride = (flag: string) => {
  const overrides = readOverrides();
  if (!(flag in overrides)) return;
  delete overrides[flag];
  writeOverrides(overrides);
};

/**
 * Check if a feature flag is enabled
 */
export const isFeatureFlagEnabled = (flag: string, fallback: boolean = false): boolean => {
  const override = getFeatureFlagOverride(flag);
  if (typeof override === "boolean") return override;
  const flags = getFeatureFlags();
  // If the flag is not explicitly declared in env, use caller-provided fallback.
  // This avoids "everything off by default" surprises and lets features opt-in/out intentionally.
  if (typeof flags[flag] === "boolean") return flags[flag] === true;
  return fallback;
};
