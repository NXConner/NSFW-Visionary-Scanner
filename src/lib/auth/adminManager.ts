/**
 * Admin Role Management System
 * Provides admin user detection, role management, and access control.
 * Admin users are configured via environment variables for security.
 */

import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ============================================
// Types
// ============================================

export type AdminRole = "super_admin" | "admin" | "moderator";

export interface AdminUser {
  userId: string;
  email: string;
  role: AdminRole;
  createdAt: Date;
  permissions: AdminPermission[];
}

export type AdminPermission =
  | "manage_users"
  | "manage_content"
  | "manage_dlc"
  | "manage_nsfw"
  | "view_analytics"
  | "manage_settings"
  | "manage_partners"
  | "full_access";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: ["full_access"],
  admin: [
    "manage_users",
    "manage_content",
    "manage_dlc",
    "manage_nsfw",
    "view_analytics",
    "manage_settings",
    "manage_partners",
  ],
  moderator: ["manage_content", "view_analytics"],
};

function normalizeEmail(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

// ============================================
// Environment Configuration
// ============================================

/**
 * Get admin emails from environment variables
 * NOTE: core/admin emails have safe defaults but can be overridden per environment.
 */
function getAdminEmails(): string[] {
  const adminEmails: string[] = [];

  // Primary admin email from VITE_ADMIN_EMAIL
  const primaryAdmin = normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL || "butterflii18@gmail.com");
  if (primaryAdmin) adminEmails.push(primaryAdmin);

  // Super admin email from ADMIN_SUPER_EMAIL (also check VITE_ prefix for client-side access)
  const superAdmin = normalizeEmail(
    import.meta.env.VITE_ADMIN_SUPER_EMAIL ||
      import.meta.env.ADMIN_SUPER_EMAIL ||
      "n8ter8@gmail.com",
  );
  if (superAdmin) adminEmails.push(superAdmin);

  // Additional admin emails from VITE_ADDITIONAL_ADMINS (comma-separated)
  const additionalAdmins = import.meta.env.VITE_ADDITIONAL_ADMINS;
  if (additionalAdmins) {
    const extras = additionalAdmins
      .split(",")
      .map((e: string) => normalizeEmail(e))
      .filter(Boolean);
    adminEmails.push(...extras);
  }

  // Remove duplicates
  return [...new Set(adminEmails)];
}

// ============================================
// Cache
// ============================================

const ADMIN_CACHE_KEY = "admin_manager_cache";
const CACHE_TTL_MS = 60000; // 1 minute

interface AdminCache {
  userId: string;
  isAdmin: boolean;
  role: AdminRole | null;
  timestamp: number;
}

let memoryCache: AdminCache | null = null;

function getCachedStatus(userId: string): AdminCache | null {
  // Check memory cache first
  if (memoryCache && memoryCache.userId === userId) {
    if (Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
      return memoryCache;
    }
  }

  // Check localStorage
  try {
    const stored = localStorage.getItem(ADMIN_CACHE_KEY);
    if (stored) {
      const parsed: AdminCache = JSON.parse(stored);
      if (parsed.userId === userId && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch {
    // localStorage may not be available
  }

  return null;
}

function setCachedStatus(userId: string, isAdmin: boolean, role: AdminRole | null): void {
  const cache: AdminCache = {
    userId,
    isAdmin,
    role,
    timestamp: Date.now(),
  };

  memoryCache = cache;

  try {
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage may not be available
  }
}

export function clearAdminCache(): void {
  memoryCache = null;
  try {
    localStorage.removeItem(ADMIN_CACHE_KEY);
  } catch {
    // localStorage may not be available
  }
}

// ============================================
// Admin Check Functions
// ============================================

/**
 * Check if a user is an admin by email configuration
 */
export function isAdminByEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase().trim());
}

/**
 * Get the admin role for an email
 */
export function getAdminRoleByEmail(email?: string | null): AdminRole | null {
  if (!email) return null;
  const normalizedEmail = normalizeEmail(email);

  // Check if super admin
  const superAdminEmail = normalizeEmail(
    import.meta.env.VITE_ADMIN_SUPER_EMAIL ||
      import.meta.env.ADMIN_SUPER_EMAIL ||
      "n8ter8@gmail.com",
  );

  if (superAdminEmail && normalizedEmail === superAdminEmail) {
    return "super_admin";
  }

  // Check if primary admin
  const primaryAdminEmail = normalizeEmail(
    import.meta.env.VITE_ADMIN_EMAIL || "butterflii18@gmail.com",
  );
  if (primaryAdminEmail && normalizedEmail === primaryAdminEmail) {
    return "admin";
  }

  // Check additional admins
  const additionalAdmins = import.meta.env.VITE_ADDITIONAL_ADMINS;
  if (additionalAdmins) {
    const extras = additionalAdmins.split(",").map((e: string) => normalizeEmail(e));
    if (extras.includes(normalizedEmail)) {
      return "admin";
    }
  }

  return null;
}

/**
 * Check if current user is an admin (async, checks database)
 */
export async function checkAdminRole(
  userId: string,
): Promise<{ isAdmin: boolean; role: AdminRole | null }> {
  // Check cache first
  const cached = getCachedStatus(userId);
  if (cached) {
    return { isAdmin: cached.isAdmin, role: cached.role };
  }

  try {
    // First check database user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!roleError && roleData && roleData.length > 0) {
      const roles = roleData.map(r => String(r.role));

      if (roles.includes("super_admin")) {
        setCachedStatus(userId, true, "super_admin");
        return { isAdmin: true, role: "super_admin" };
      }

      if (roles.includes("admin")) {
        setCachedStatus(userId, true, "admin");
        return { isAdmin: true, role: "admin" };
      }

      if (roles.includes("moderator")) {
        setCachedStatus(userId, true, "moderator");
        return { isAdmin: true, role: "moderator" };
      }
    }

    // Fallback: check email-based admin configuration
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;

    if (email) {
      const emailRole = getAdminRoleByEmail(email);
      if (emailRole) {
        setCachedStatus(userId, true, emailRole);
        return { isAdmin: true, role: emailRole };
      }
    }

    setCachedStatus(userId, false, null);
    return { isAdmin: false, role: null };
  } catch (err) {
    logger.error("[adminManager] Failed to check admin role", err);
    return { isAdmin: false, role: null };
  }
}

/**
 * Synchronous admin check using cached value
 */
export function isAdminCached(userId?: string | null): boolean {
  if (!userId) return false;
  const cached = getCachedStatus(userId);
  return cached?.isAdmin ?? false;
}

/**
 * Get admin permissions for a role
 */
export function getAdminPermissions(role?: AdminRole | null): AdminPermission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if admin has a specific permission
 */
export function hasAdminPermission(role: AdminRole | null, permission: AdminPermission): boolean {
  if (!role) return false;
  const permissions = getAdminPermissions(role);
  return permissions.includes("full_access") || permissions.includes(permission);
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdminUser(user?: User | null): Promise<boolean> {
  if (!user?.id) return false;
  const { role } = await checkAdminRole(user.id);
  return role === "super_admin";
}

// ============================================
// Exports
// ============================================

export const adminManager = {
  isAdminByEmail,
  getAdminRoleByEmail,
  checkAdminRole,
  isAdminCached,
  getAdminPermissions,
  hasAdminPermission,
  isSuperAdminUser,
  clearAdminCache,
};

export default adminManager;
