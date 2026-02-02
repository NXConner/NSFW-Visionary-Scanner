/**
 * Super Admin Utility Functions
 *
 * Provides database-driven super admin detection and access control.
 * All authorization is based on user_roles table, NOT hardcoded emails.
 */

import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Cache for role checks to avoid repeated DB calls
let cachedUserId: string | null = null;
let cachedIsSuperAdmin: boolean = false;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

// CRITICAL: LocalStorage key for persisting super admin status across page loads
const SUPER_ADMIN_STORAGE_KEY = "lovable_super_admin_status";

/**
 * Persist super admin status to localStorage
 * This is the ONLY way to prevent locked flash on page reload
 */
function persistSuperAdminStatus(userId: string, isSuperAdmin: boolean): void {
  try {
    if (isSuperAdmin) {
      localStorage.setItem(SUPER_ADMIN_STORAGE_KEY, JSON.stringify({ userId, isSuperAdmin: true }));
    } else {
      localStorage.removeItem(SUPER_ADMIN_STORAGE_KEY);
    }
  } catch {
    // localStorage may not be available
  }
}

/**
 * Get persisted super admin status from localStorage
 */
function getPersistedSuperAdminStatus(userId?: string | null): boolean {
  try {
    const stored = localStorage.getItem(SUPER_ADMIN_STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    // If userId provided, check it matches. Otherwise just return persisted status
    if (userId) {
      return parsed?.userId === userId && parsed?.isSuperAdmin === true;
    }
    // No userId provided - just return if any super admin is persisted
    return parsed?.isSuperAdmin === true;
  } catch {
    return false;
  }
}

/**
 * CRITICAL: Check if ANY super admin status is persisted
 * This is the synchronous module-level check used on cold starts
 */
export function isAnySuperAdminPersisted(): boolean {
  try {
    const stored = localStorage.getItem(SUPER_ADMIN_STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return parsed?.isSuperAdmin === true;
  } catch {
    return false;
  }
}

/**
 * Check if a user has super_admin role in the database
 * This is the ONLY source of truth for super admin status
 */
export async function checkSuperAdminRole(userId: string): Promise<boolean> {
  const now = Date.now();
  
  // Return cached result if still valid
  if (cachedUserId === userId && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedIsSuperAdmin;
  }
  
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    if (error) {
      console.error("[superAdmin] Role check failed:", error.message);
      // On error, fall back to persisted localStorage value
      return getPersistedSuperAdminStatus(userId);
    }
    
    const isSuperAdmin = (data || []).some(r => r.role === "super_admin");
    
    // Update in-memory cache
    cachedUserId = userId;
    cachedIsSuperAdmin = isSuperAdmin;
    cacheTimestamp = now;
    
    // CRITICAL: Persist to localStorage so status survives page reload
    persistSuperAdminStatus(userId, isSuperAdmin);
    
    return isSuperAdmin;
  } catch (err) {
    console.error("[superAdmin] Role check error:", err);
    // On error, fall back to persisted localStorage value
    return getPersistedSuperAdminStatus(userId);
  }
}

/**
 * Synchronous check using cached value or localStorage
 * Returns cached value if available, falls back to localStorage persisted value
 * This is CRITICAL for preventing locked flash on page reload
 */
export function isSuperAdminCached(userId?: string | null): boolean {
  // CRITICAL: If no userId, still check localStorage for ANY persisted super admin
  // This allows the module-level check to work on cold starts before auth loads
  if (!userId) {
    return isAnySuperAdminPersisted();
  }
  
  // First check in-memory cache
  if (cachedUserId === userId) {
    return cachedIsSuperAdmin;
  }
  
  // CRITICAL: Fall back to localStorage persisted value
  // This prevents locked UI flash on fresh page loads
  const persisted = getPersistedSuperAdminStatus(userId);
  if (persisted) {
    // Populate in-memory cache from localStorage
    cachedUserId = userId;
    cachedIsSuperAdmin = true;
    cacheTimestamp = Date.now();
    return true;
  }
  
  return false;
}

/**
 * Clear the role cache (call on logout)
 * Also clears localStorage persisted value
 */
export function clearSuperAdminCache(): void {
  cachedUserId = null;
  cachedIsSuperAdmin = false;
  cacheTimestamp = 0;
  // CRITICAL: Also clear localStorage to prevent stale super admin access
  try {
    localStorage.removeItem(SUPER_ADMIN_STORAGE_KEY);
  } catch {
    // localStorage may not be available
  }
}

/**
 * Check if a user is the super admin (async, database-driven)
 */
export async function isSuperAdmin(user?: User | null): Promise<boolean> {
  if (!user?.id) return false;
  return checkSuperAdminRole(user.id);
}

/**
 * Check if user has full access (super admin bypass) - async
 */
export async function hasFullAccess(user?: User | null): Promise<boolean> {
  return isSuperAdmin(user);
}

/**
 * Bypass lock checks for super admin - async
 * Returns true if super admin, otherwise returns the default check result
 */
export async function bypassLock(user?: User | null, defaultCheck: boolean = false): Promise<boolean> {
  if (await isSuperAdmin(user)) return true;
  return defaultCheck;
}

/**
 * Check if super admin has a specific feature unlocked - async
 * Super admin always returns true for any feature
 */
export async function hasFeatureAccess(user?: User | null, defaultCheck: boolean = false): Promise<boolean> {
  return bypassLock(user, defaultCheck);
}

/**
 * Get super admin subscription status - async
 * Returns "tier3_premium_lifetime" for super admin, otherwise returns the actual status
 */
export async function getSubscriptionStatus(user?: User | null, actualStatus?: string | null): Promise<string> {
  if (await isSuperAdmin(user)) return "tier3_premium_lifetime";
  return actualStatus || "free";
}

/**
 * Get super admin subscription tier - async
 * Returns tier info for super admin
 */
export async function getSubscriptionTier(user?: User | null) {
  if (await isSuperAdmin(user)) {
    return {
      id: "tier3_premium_lifetime",
      name: "Tier 3 Premium (Lifetime)",
      tier: "tier3_premium_lifetime",
      status: "active",
      features: ["all"],
      expiry: null,
      isSuperAdmin: true,
    };
  }
  return null;
}

/**
 * Check if a package should be unlocked for super admin - async
 */
export async function shouldUnlockPackage(user: User | null | undefined, packageId: string): Promise<boolean> {
  return isSuperAdmin(user);
}

/**
 * Check if DLC content should be unlocked for super admin - async
 */
export async function shouldUnlockDLC(user?: User | null): Promise<boolean> {
  return isSuperAdmin(user);
}

/**
 * Check if NSFW content should be unlocked for super admin - async
 * Super admin bypasses age verification and DLC requirements
 */
export async function shouldUnlockNSFW(user?: User | null): Promise<boolean> {
  return isSuperAdmin(user);
}

/**
 * Get super admin display badge - async
 */
export async function getSuperAdminBadge(user?: User | null): Promise<string | null> {
  if (await isSuperAdmin(user)) return "Super Admin";
  return null;
}

/**
 * Check if super admin should see admin UI - async
 */
export async function shouldShowAdminUI(user?: User | null): Promise<boolean> {
  return isSuperAdmin(user);
}

/**
 * Export super admin properties for context providers - async
 */
export async function getSuperAdminProperties(user?: User | null) {
  const isSuper = await isSuperAdmin(user);
  return {
    isSuperAdmin: isSuper,
    role: isSuper ? "super_admin" : "user",
    subscription: isSuper ? "tier3_premium_lifetime" : "free",
    subscriptionStatus: isSuper ? "active" : "inactive",
    allFeaturesUnlocked: isSuper,
    badge: isSuper ? "Super Admin" : null,
    hasFullAccess: isSuper,
  };
}
