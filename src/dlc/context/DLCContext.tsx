/**
 * DLC Context Provider
 * React context for DLC state management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { dlcManager, DLCManager } from "../core";
import { dlcRegistry } from "../core/DLCRegistry";
import { licenseValidator } from "../core/LicenseValidator";
import { supabase } from "@/integrations/supabase/client";
import type {
  DLCPackage,
  DLCLicense,
  DLCInstallation,
  DLCStoreState,
  DownloadProgress,
  DLCUpdate,
  LicenseValidationResult,
} from "../core/types";
import { logger } from "@/lib/logger";
import { checkSuperAdminRole, clearSuperAdminCache, isSuperAdminCached } from "@/lib/superAdmin";
import { useUserRoles } from "@/hooks/useUserRoles";

// ============================================
// Development Mode Configuration
// ============================================
const DEV_MODE = import.meta.env.DEV || import.meta.env.MODE === "development";
const DEV_BYPASS_AGE_VERIFICATION =
  DEV_MODE && localStorage.getItem("dev_bypass_age_verification") === "true";

// ============================================
// Context Types
// ============================================

interface DLCContextValue {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Packages
  packages: DLCPackage[];
  featuredPackages: DLCPackage[];
  ownedPackages: DLCPackage[];
  installedPackages: DLCPackage[];

  // Status Checks
  ownsPackage: (packageId: string) => boolean;
  isPackageInstalled: (packageId: string) => boolean;
  hasFeature: (featureId: string) => boolean;

  // License Operations
  getLicense: (packageId: string) => DLCLicense | undefined;
  validateLicense: (packageId: string) => Promise<LicenseValidationResult>;
  activateLicense: (
    licenseKey: string,
  ) => Promise<{ success: boolean; packageId?: string; error?: string }>;

  // Installation Operations
  getInstallation: (packageId: string) => DLCInstallation | undefined;
  installPackage: (packageId: string) => Promise<{ success: boolean; error?: string }>;
  uninstallPackage: (packageId: string) => Promise<{ success: boolean; error?: string }>;

  // Download Operations
  getDownloadProgress: (packageId: string) => DownloadProgress | undefined;
  getActiveDownloads: () => DownloadProgress[];

  // Updates
  checkForUpdates: () => Promise<DLCUpdate[]>;
  availableUpdates: DLCUpdate[];

  // Age Verification
  isAgeVerified: boolean;
  verifyAge: (age: number, consent: boolean) => Promise<boolean>;

  // Update Source
  updateSource: "store" | "website";
  isUpdateSourceAcknowledged: boolean;
  acknowledgeUpdateSourceChange: () => void;

  // Pricing
  calculateUpgradePrice: (targetPackageId: string) => number;
  getRegionalPrice: (packageId: string, currency: string) => number;

  // Refresh
  refresh: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const DLCContext = createContext<DLCContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface DLCProviderProps {
  children: React.ReactNode;
}

export function DLCProvider({ children }: DLCProviderProps): React.ReactElement {
  // SUPER ADMIN EARLY UNLOCK: Check cached value IMMEDIATELY on first render
  // This prevents any locked/age verification flash for returning super admin users
  const cachedSuperAdminStatus = useMemo(() => {
    try {
      const storedUserId = localStorage.getItem("lovable_last_user_id");
      if (storedUserId) {
        // Use the synchronous cached check from superAdmin.ts
        return isSuperAdminCached(storedUserId);
      }
    } catch {
      // localStorage may not be available
    }
    return false;
  }, []);
  const { isAdmin, isSuperAdmin: isSuperAdminRole } = useUserRoles();
  const hasPrivilegedRole = isAdmin || isSuperAdminRole;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeState, setStoreState] = useState<DLCStoreState | null>(null);
  const [availableUpdates, setAvailableUpdates] = useState<DLCUpdate[]>([]);
  // SUPER ADMIN: Initialize with cached status to prevent age verification flash
  // Also check localStorage for persisted age verification
  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    if (DEV_BYPASS_AGE_VERIFICATION || cachedSuperAdminStatus) return true;
    // Check localStorage for persisted age verification
    try {
      const stored = localStorage.getItem("dlc_age_verified_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.verified && parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
          return true;
        }
      }
    } catch {
      // ignore localStorage errors
    }
    return false;
  });
  // SUPER ADMIN: Initialize with cached status to prevent locked feature flash
  const [adminOverrideActive, setAdminOverrideActive] = useState(cachedSuperAdminStatus);
  const [adminNsfwMasterEnabled, setAdminNsfwMasterEnabled] = useState(cachedSuperAdminStatus);
  const [adminEnabledPackageIds, setAdminEnabledPackageIds] = useState<Set<string>>(new Set());

  // Prefer DB-backed catalog, but always merge registry metadata as a fallback.
  // This prevents "blank package name" UI when an older cached schema is present.
  const packages = useMemo<DLCPackage[]>(() => {
    const registryPackages = dlcRegistry.getAllPackages();
    const regById = new Map(registryPackages.map(p => [p.packageId, p] as const));

    const base =
      storeState?.packages && storeState.packages.length > 0
        ? storeState.packages
        : registryPackages;

    const mergedById = new Map<string, DLCPackage>();
    for (const p of base) {
      const reg = regById.get(p.packageId);
      if (!reg) {
        mergedById.set(p.packageId, p);
        continue;
      }

      const merged: DLCPackage = {
        ...reg,
        ...p,
        packageName:
          p.packageName && p.packageName.trim() && p.packageName.trim() !== p.packageId
            ? p.packageName
            : reg.packageName,
        safeDescription:
          p.safeDescription && p.safeDescription.trim() ? p.safeDescription : reg.safeDescription,
        fullDescription:
          p.fullDescription && p.fullDescription.trim() ? p.fullDescription : reg.fullDescription,
        contentRating: (p.contentRating || reg.contentRating) as DLCPackage["contentRating"],
        features: p.features && p.features.length > 0 ? p.features : reg.features,
      };
      mergedById.set(merged.packageId, merged);
    }

    // Super-admin override and entitlement UI expect a complete catalog (even if DB/cache is partial).
    for (const reg of registryPackages) {
      if (!mergedById.has(reg.packageId)) mergedById.set(reg.packageId, reg);
    }

    return Array.from(mergedById.values())
      .filter(p => p.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [storeState]);

  const packageById = useMemo(() => {
    const map = new Map<string, DLCPackage>();
    for (const p of packages) map.set(p.packageId, p);
    return map;
  }, [packages]);

  const isAdultPackage = useCallback(
    (packageId: string): boolean => {
      const p = packageById.get(packageId);
      const rating = String(p?.contentRating ?? "");
      return rating === "18+" || rating === "adult" || rating === "mature";
    },
    [packageById],
  );

  const isAdminPackageEnabled = useCallback(
    (packageId: string): boolean => {
      // SUPER ADMIN UNLOCK: All packages (including adult/NSFW) are automatically enabled
      // This ensures super_admin has immediate access to ALL features for testing
      if (!adminOverrideActive) return false;

      // All non-adult packages are always enabled for super_admin
      if (!isAdultPackage(packageId)) return true;

      // AUTO-UNLOCK FOR SUPER ADMIN: All adult/NSFW packages enabled by default
      // Master NSFW switch is auto-enabled (set to true in initialization)
      // This provides complete access without any manual toggles

      // Enable all NSFW packages when master is enabled (which it is by default for super_admin)
      // Per-package toggles are only checked if master is ON and specific packages were toggled
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

  // Initialize DLC Manager with AGGRESSIVE timeout
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Start initialization, but NEVER permanently "lock in" the fallback store state.
        // We want:
        // - fast first paint (from cache/registry)
        // - eventual consistency (update storeState once DB-backed packages arrive)
        const initPromise = dlcManager.initialize();

        // Immediately reflect whatever is available right now (registry/cache).
        setStoreState(dlcManager.getStoreState());

        // Background refresh once initialization completes (DB packages, licenses, installations).
        void initPromise
          .then(() => {
            if (cancelled) return;
            setStoreState(dlcManager.getStoreState());
          })
          .catch(err => {
            // DLCManager already fails open; keep UI alive but log for diagnostics.
            logger.warn("[dlc] Init failed (non-fatal)", {
              error: err instanceof Error ? err.message : String(err),
            });
          });

        if (cancelled) return;

        // Admin override (ONLY for super_admin in user_roles table - database-driven)
        supabase.auth
          .getUser()
          .then(async ({ data }) => {
            if (cancelled) return;
            const user = data.user;

            if (!user) {
              setAdminOverrideActive(false);
              return;
            }

            // Database-driven super admin check - no hardcoded emails
            const isSuperAdminUser = await checkSuperAdminRole(user.id);
            setAdminOverrideActive(isSuperAdminUser);

            if (isSuperAdminUser) {
              // AUTO-UNLOCK: All NSFW and adult content enabled for super_admin
              setAdminNsfwMasterEnabled(true);
              logger.info("[dlc] SUPER ADMIN UNLOCK: All features and NSFW content enabled");
            }
          })
          .catch(() => {
            setAdminOverrideActive(false);
          });

        // Age verification - fire and forget
        supabase.auth
          .getUser()
          .then(async ({ data }) => {
            const user = data.user;

            if (!user) return;

            // Database-driven super admin check for age verification bypass
            const isSuperAdminUser = await checkSuperAdminRole(user.id);

            // Super admin bypasses age verification
            if (isSuperAdminUser) {
              setIsAgeVerified(true);
              logger.info("[dlc] SUPER ADMIN: Age verification bypassed");
              return;
            }

            // Normal users: check age verification
            dlcManager
              .isAgeVerified()
              .then(verified => {
                if (!cancelled) {
                  if (DEV_MODE) {
                    console.log("[DLC] Age verification status:", verified);
                    console.log("[DLC] DEV_BYPASS_AGE_VERIFICATION:", DEV_BYPASS_AGE_VERIFICATION);
                  }
                  setIsAgeVerified(DEV_BYPASS_AGE_VERIFICATION || verified);
                }
              })
              .catch(() => {});
          })
          .catch(() => {});

        setIsInitialized(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "DLC init failed");
        // Still mark initialized to prevent blocking
        setIsInitialized(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasPrivilegedRole) return;
    setAdminOverrideActive(true);
    setAdminNsfwMasterEnabled(true);
    setAdminEnabledPackageIds(new Set());
    setIsAgeVerified(true);
  }, [hasPrivilegedRole]);

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
          .then(verified => setIsAgeVerified(DEV_BYPASS_AGE_VERIFICATION || verified))
          .catch(() => {});
        return;
      }

      // Database-driven super admin check
      const isSuper = await checkSuperAdminRole(userId);

      setAdminOverrideActive(isSuper);

      if (isSuper) {
        // Absolute unlock: all packages + NSFW + age verified.
        setAdminNsfwMasterEnabled(true);
        setAdminEnabledPackageIds(new Set());
        setIsAgeVerified(true);
      } else {
        // Re-evaluate normal age verification state.
        dlcManager
          .isAgeVerified()
          .then(verified => setIsAgeVerified(DEV_BYPASS_AGE_VERIFICATION || verified))
          .catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAdminToggles = useCallback(async (): Promise<void> => {
    if (!adminOverrideActive) return;
    // Super-admin override is intended to be absolute: everything unlocked always.
    // Remote admin toggles must never re-lock NSFW/adult packages for super admin.
    setAdminNsfwMasterEnabled(true);
    setAdminEnabledPackageIds(new Set());
  }, [adminOverrideActive]);

  // If super-admin override becomes active after auth/role checks, immediately load admin toggles
  // so NSFW gating updates without requiring a manual refresh.
  useEffect(() => {
    if (!adminOverrideActive) return;
    void loadAdminToggles();
  }, [adminOverrideActive, loadAdminToggles]);

  // Listen for admin toggle changes and refresh entitlements.
  useEffect(() => {
    const onChanged = () => {
      if (!adminOverrideActive) return;
      void loadAdminToggles();
    };
    window.addEventListener("dlc-admin-toggles-changed", onChanged as EventListener);
    return () =>
      window.removeEventListener("dlc-admin-toggles-changed", onChanged as EventListener);
  }, [adminOverrideActive, loadAdminToggles]);

  // Refresh store state
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const state = dlcManager.getStoreState();
      setStoreState(state);

      const updates = await dlcManager.checkForUpdates();
      setAvailableUpdates(updates);

      await loadAdminToggles();
    } catch (err) {
      logger.error("DLCContext: Refresh failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [loadAdminToggles]);

  // Package lists
  const featuredPackages = useMemo(() => packages.filter(p => p.isFeatured), [packages]);

  const ownedPackages = useMemo(() => {
    if (adminOverrideActive) {
      // Super-admin override behaves like "owns everything" while still requiring
      // explicit master enable for adult-rated packages.
      return packages.filter(p => isAdminPackageEnabled(p.packageId));
    }
    return packages.filter(p => storeState?.ownedPackages.includes(p.packageId));
  }, [adminOverrideActive, isAdminPackageEnabled, packages, storeState]);

  const installedPackages = useMemo(() => {
    if (adminOverrideActive) {
      // Match ownedPackages behavior for UI gating ("installed" is used as entitlement fallback).
      return packages.filter(p => isAdminPackageEnabled(p.packageId));
    }
    return packages.filter(p => storeState?.installedPackages.includes(p.packageId));
  }, [adminOverrideActive, isAdminPackageEnabled, packages, storeState]);

  // Status checks
  const ownsPackage = useCallback(
    (packageId: string) => {
      if (adminOverrideActive) return isAdminPackageEnabled(packageId);
      return dlcManager.ownsPackage(packageId);
    },
    [adminOverrideActive, isAdminPackageEnabled],
  );

  const isPackageInstalled = useCallback(
    (packageId: string) => {
      if (adminOverrideActive) return isAdminPackageEnabled(packageId);
      return dlcManager.isPackageInstalled(packageId);
    },
    [adminOverrideActive, isAdminPackageEnabled],
  );

  const hasFeature = useCallback(
    (featureId: string) => {
      if (!adminOverrideActive) return dlcManager.hasFeature(featureId);

      // SUPER ADMIN UNLOCK: treat every feature as available.
      // Rationale: super admin must never be blocked by catalog/manifest feature-ID mismatches
      // or partial DB package metadata during development/testing.
      return true;
    },
    [adminOverrideActive],
  );

  // License operations
  const getLicense = useCallback((packageId: string) => dlcManager.getLicense(packageId), []);

  const validateLicense = useCallback(
    async (packageId: string) => dlcManager.validateLicense(packageId),
    [],
  );

  const activateLicense = useCallback(
    async (licenseKey: string) => {
      const result = await dlcManager.activateLicense(licenseKey);
      if (result.success) {
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  // Installation operations
  const getInstallation = useCallback(
    (packageId: string) => dlcManager.getInstallation(packageId),
    [],
  );

  const installPackage = useCallback(
    async (packageId: string) => {
      const result = await dlcManager.installPackage(packageId);
      if (result.success) {
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  const uninstallPackage = useCallback(
    async (packageId: string) => {
      const result = await dlcManager.uninstallPackage(packageId);
      if (result.success) {
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  // Download operations
  const getDownloadProgress = useCallback(
    (packageId: string) => dlcManager.getDownloadProgress(packageId),
    [],
  );

  const getActiveDownloads = useCallback(() => dlcManager.getActiveDownloads(), []);

  // Updates
  const checkForUpdates = useCallback(async () => {
    const updates = await dlcManager.checkForUpdates();
    setAvailableUpdates(updates);
    return updates;
  }, []);

  // Age verification
  const verifyAge = useCallback(async (age: number, consent: boolean) => {
    if (DEV_MODE) {
      console.log("[DLC] Verifying age:", { age, consent });
    }
    const result = await dlcManager.verifyAge(age, consent);
    if (DEV_MODE) {
      console.log("[DLC] Age verification result:", result);
    }
    setIsAgeVerified(result);
    // Force a refresh to update all dependent components
    window.dispatchEvent(new CustomEvent("dlc-age-verified"));
    return result;
  }, []);

  // Update source
  const updateSource = dlcManager.getUpdateSource();
  const isUpdateSourceAcknowledged = dlcManager.isUpdateSourceAcknowledged();

  const acknowledgeUpdateSourceChange = useCallback(() => {
    dlcManager.acknowledgeUpdateSourceChange();
    refresh();
  }, [refresh]);

  // Pricing
  const calculateUpgradePrice = useCallback(
    (targetPackageId: string) => dlcManager.calculateUpgradePrice(targetPackageId),
    [],
  );

  const getRegionalPrice = useCallback(
    (packageId: string, currency: string) => dlcRegistry.getRegionalPrice(packageId, currency),
    [],
  );

  // Context value
  const value = useMemo<DLCContextValue>(
    () => ({
      isInitialized,
      isLoading,
      error,

      packages,
      featuredPackages,
      ownedPackages,
      installedPackages,

      ownsPackage,
      isPackageInstalled,
      hasFeature,

      getLicense,
      validateLicense,
      activateLicense,

      getInstallation,
      installPackage,
      uninstallPackage,

      getDownloadProgress,
      getActiveDownloads,

      checkForUpdates,
      availableUpdates,

      isAgeVerified,
      verifyAge,

      updateSource,
      isUpdateSourceAcknowledged,
      acknowledgeUpdateSourceChange,

      calculateUpgradePrice,
      getRegionalPrice,

      refresh,
    }),
    [
      isInitialized,
      isLoading,
      error,
      packages,
      featuredPackages,
      ownedPackages,
      installedPackages,
      ownsPackage,
      isPackageInstalled,
      hasFeature,
      getLicense,
      validateLicense,
      activateLicense,
      getInstallation,
      installPackage,
      uninstallPackage,
      getDownloadProgress,
      getActiveDownloads,
      checkForUpdates,
      availableUpdates,
      isAgeVerified,
      verifyAge,
      updateSource,
      isUpdateSourceAcknowledged,
      acknowledgeUpdateSourceChange,
      calculateUpgradePrice,
      getRegionalPrice,
      refresh,
    ],
  );

  return <DLCContext.Provider value={value}>{children}</DLCContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useDLC(): DLCContextValue {
  const context = useContext(DLCContext);

  if (!context) {
    throw new Error("useDLC must be used within a DLCProvider");
  }

  return context;
}

/**
 * Optional DLC hook for components/tests rendered outside of `DLCProvider`.
 * Returns null instead of throwing.
 */
export function useOptionalDLC(): DLCContextValue | null {
  return useContext(DLCContext);
}

// ============================================
// Feature-specific hooks
// ============================================

/**
 * Check if a specific DLC package is available (owned and installed)
 */
export function useDLCPackage(packageId: string) {
  const { ownsPackage, isPackageInstalled, getLicense, getInstallation, installPackage } = useDLC();

  return useMemo(
    () => ({
      isOwned: ownsPackage(packageId),
      isInstalled: isPackageInstalled(packageId),
      license: getLicense(packageId),
      installation: getInstallation(packageId),
      install: () => installPackage(packageId),
    }),
    [packageId, ownsPackage, isPackageInstalled, getLicense, getInstallation, installPackage],
  );
}

/**
 * Check if a specific feature is available
 */
export function useDLCFeature(featureId: string) {
  const { hasFeature, isInitialized, isLoading } = useDLC();

  return useMemo(
    () => ({
      isAvailable: isInitialized && hasFeature(featureId),
      isLoading,
    }),
    [featureId, hasFeature, isInitialized, isLoading],
  );
}

/**
 * Optional variant of `useDLCFeature` that never throws.
 * Useful for components that can run without DLC context (tests, embed modes).
 */
export function useOptionalDLCFeature(featureId: string) {
  const ctx = useContext(DLCContext);
  const isInitialized = Boolean(ctx?.isInitialized);
  const isLoading = Boolean(ctx?.isLoading);
  const isAvailable = Boolean(ctx?.isInitialized && ctx?.hasFeature(featureId));
  return useMemo(
    () => ({
      isAvailable,
      isLoading,
      isInitialized,
    }),
    [isAvailable, isInitialized, isLoading],
  );
}

/**
 * Check if NSFW content is available
 */
export function useNSFWAvailable() {
  const { ownedPackages, installedPackages, isAgeVerified, isInitialized, isLoading } = useDLC();

  return useMemo(() => {
    // Entitlement: owned OR installed adult-rated package.
    // (Some features are server-backed and do not require installation.)
    const hasNSFWPackage = [...ownedPackages, ...installedPackages].some(
      p => p.contentRating === "18+" || p.contentRating === "adult",
    );

    return {
      isAvailable: isInitialized && isAgeVerified && hasNSFWPackage,
      requiresAgeVerification: !isAgeVerified,
      requiresDLC: !hasNSFWPackage,
      isLoading,
    };
  }, [ownedPackages, installedPackages, isAgeVerified, isInitialized, isLoading]);
}
