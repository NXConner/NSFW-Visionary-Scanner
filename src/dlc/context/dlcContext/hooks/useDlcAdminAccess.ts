import { useCallback, useEffect, useMemo, useState } from "react";

import { dlcManager } from "@/dlc/core";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  checkSuperAdminRole,
  clearSuperAdminCache,
  isAnySuperAdminPersisted,
  isSuperAdminCached,
} from "@/lib/superAdmin";
import { useUserRoles } from "@/hooks/useUserRoles";

function isDevMode(): boolean {
  try {
    return Boolean(import.meta.env?.DEV) || String(import.meta.env?.MODE || "") === "development";
  } catch {
    return false;
  }
}

function readDevBypassAgeVerification(): boolean {
  if (!isDevMode()) return false;
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("dev_bypass_age_verification") === "true";
  } catch {
    return false;
  }
}

export function useDlcAdminAccess(args: { isAdultPackage: (packageId: string) => boolean }): {
  adminOverrideActive: boolean;
  isAgeVerified: boolean;
  verifyAge: (age: number, consent: boolean) => Promise<boolean>;
  isAdminPackageEnabled: (packageId: string) => boolean;
  loadAdminToggles: () => Promise<void>;
} {
  const { isAdultPackage } = args;

  // SUPER ADMIN EARLY UNLOCK: Check cached value IMMEDIATELY on first render
  // This prevents any locked/age verification flash for returning super admin users.
  const cachedSuperAdminStatus = useMemo(() => {
    try {
      if (typeof window === "undefined") return false;
      // Prefer the broader persisted privileged status (admin OR super_admin) to avoid
      // "locked flash" for admin accounts on cold loads.
      if (isAnySuperAdminPersisted()) return true;
      const storedUserId = window.localStorage.getItem("lovable_last_user_id");
      if (!storedUserId) return false;
      return isSuperAdminCached(storedUserId);
    } catch {
      return false;
    }
  }, []);

  const { isAdmin, isSuperAdmin: isSuperAdminRole } = useUserRoles();
  const hasPrivilegedRole = isAdmin || isSuperAdminRole;

  const devBypassAgeVerification = useMemo(() => readDevBypassAgeVerification(), []);

  // SUPER ADMIN: Initialize with cached status to prevent locked/age verification flash
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(
    devBypassAgeVerification || cachedSuperAdminStatus,
  );
  const [adminOverrideActive, setAdminOverrideActive] = useState<boolean>(cachedSuperAdminStatus);
  const [adminNsfwMasterEnabled, setAdminNsfwMasterEnabled] =
    useState<boolean>(cachedSuperAdminStatus);
  const [adminEnabledPackageIds, setAdminEnabledPackageIds] = useState<Set<string>>(new Set());

  const isAdminPackageEnabled = useCallback(
    (packageId: string): boolean => {
      // SUPER ADMIN UNLOCK: All packages (including adult/NSFW) are automatically enabled
      // when override is active.
      if (!adminOverrideActive) return false;

      // All non-adult packages are always enabled for super_admin
      if (!isAdultPackage(packageId)) return true;

      // Adult/NSFW packages are gated behind the (super-admin default) master enable.
      if (adminNsfwMasterEnabled) {
        // If no per-package toggles exist, all NSFW packages are enabled
        if (adminEnabledPackageIds.size === 0) return true;
        // If per-package toggles exist, check specific package
        return adminEnabledPackageIds.has(packageId);
      }

      return false;
    },
    [adminEnabledPackageIds, adminNsfwMasterEnabled, isAdultPackage, adminOverrideActive],
  );

  const loadAdminToggles = useCallback(async (): Promise<void> => {
    if (!adminOverrideActive) return;
    // Super-admin override is intended to be absolute: everything unlocked always.
    // Remote admin toggles must never re-lock NSFW/adult packages for super admin.
    setAdminNsfwMasterEnabled(true);
    setAdminEnabledPackageIds(new Set());
  }, [adminOverrideActive]);

  // Privileged roles (admin/super_admin via user_roles) bypass everything.
  useEffect(() => {
    if (!hasPrivilegedRole) return;
    setAdminOverrideActive(true);
    setAdminNsfwMasterEnabled(true);
    setAdminEnabledPackageIds(new Set());
    setIsAgeVerified(true);
  }, [hasPrivilegedRole]);

  // Initial auth evaluation (helps on cold load).
  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (cancelled) return;
        const userId = data.user?.id ?? null;
        if (!userId) return;

        const isSuper = await checkSuperAdminRole(userId);
        if (cancelled) return;
        setAdminOverrideActive(isSuper);

        if (isSuper) {
          setAdminNsfwMasterEnabled(true);
          setAdminEnabledPackageIds(new Set());
          setIsAgeVerified(true);
          logger.info("[dlc] SUPER ADMIN: all features + age verification bypassed");
          return;
        }

        dlcManager
          .isAgeVerified()
          .then(verified => {
            if (!cancelled) setIsAgeVerified(devBypassAgeVerification || verified);
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [devBypassAgeVerification]);

  // Keep super-admin override in sync with auth state (login/logout without refresh).
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id ?? null;

      if (!userId) {
        setAdminOverrideActive(false);
        clearSuperAdminCache();
        // Re-evaluate normal age verification state.
        dlcManager
          .isAgeVerified()
          .then(verified => setIsAgeVerified(devBypassAgeVerification || verified))
          .catch(() => {});
        return;
      }

      const isSuper = await checkSuperAdminRole(userId);
      setAdminOverrideActive(isSuper);

      if (isSuper) {
        // Absolute unlock: all packages + NSFW + age verified.
        setAdminNsfwMasterEnabled(true);
        setAdminEnabledPackageIds(new Set());
        setIsAgeVerified(true);
      } else {
        dlcManager
          .isAgeVerified()
          .then(verified => setIsAgeVerified(devBypassAgeVerification || verified))
          .catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, [devBypassAgeVerification]);

  // If super-admin override becomes active after auth/role checks, immediately load admin toggles
  // so NSFW gating updates without requiring a manual refresh.
  useEffect(() => {
    if (!adminOverrideActive) return;
    void loadAdminToggles();
  }, [adminOverrideActive, loadAdminToggles]);

  // Listen for admin toggle changes and refresh entitlements.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onChanged = () => {
      if (!adminOverrideActive) return;
      void loadAdminToggles();
    };

    window.addEventListener("dlc-admin-toggles-changed", onChanged as EventListener);
    return () =>
      window.removeEventListener("dlc-admin-toggles-changed", onChanged as EventListener);
  }, [adminOverrideActive, loadAdminToggles]);

  const verifyAge = useCallback(async (age: number, consent: boolean) => {
    if (isDevMode()) logger.debug("[dlc] Verifying age", { age, consent });

    const result = await dlcManager.verifyAge(age, consent);
    setIsAgeVerified(result);

    // Force a refresh to update all dependent components
    try {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dlc-age-verified"));
    } catch {
      // ignore
    }

    return result;
  }, []);

  return {
    adminOverrideActive,
    isAgeVerified,
    verifyAge,
    isAdminPackageEnabled,
    loadAdminToggles,
  };
}
