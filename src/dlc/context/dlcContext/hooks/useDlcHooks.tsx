import { useContext, useMemo } from "react";

import { useUserRoles } from "@/hooks/useUserRoles";

import { DLCContext } from "../context";
import type { DLCContextValue } from "../types";

export function useDLC(): DLCContextValue {
  const context = useContext(DLCContext);
  if (!context) throw new Error("useDLC must be used within a DLCProvider");
  return context;
}

/**
 * Optional DLC hook for components/tests rendered outside of `DLCProvider`.
 * Returns null instead of throwing.
 */
export function useOptionalDLC(): DLCContextValue | null {
  return useContext(DLCContext);
}

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
 * ADMIN BYPASS: Admin and super admin users always have access
 */
export function useDLCFeature(featureId: string) {
  const { hasFeature, isInitialized, isLoading } = useDLC();
  const { isAdmin, isSuperAdmin } = useUserRoles();

  return useMemo(
    () => ({
      // ADMIN BYPASS: Admin and super admin always have access, even before DLC initializes
      isAvailable: isAdmin || isSuperAdmin || (isInitialized && hasFeature(featureId)),
      isLoading: isAdmin || isSuperAdmin ? false : isLoading,
    }),
    [featureId, hasFeature, isInitialized, isLoading, isAdmin, isSuperAdmin],
  );
}

/**
 * Optional variant of `useDLCFeature` that never throws.
 * Useful for components that can run without DLC context (tests, embed modes).
 * ADMIN BYPASS: Admin and super admin users always have access
 */
export function useOptionalDLCFeature(featureId: string) {
  const ctx = useContext(DLCContext);
  const { isAdmin, isSuperAdmin } = useUserRoles();
  const isInitialized = Boolean(ctx?.isInitialized);
  const isLoading = Boolean(ctx?.isLoading);
  const isAvailable =
    isAdmin || isSuperAdmin || Boolean(ctx?.isInitialized && ctx?.hasFeature(featureId));

  return useMemo(
    () => ({
      isAvailable,
      isLoading: isAdmin || isSuperAdmin ? false : isLoading,
      isInitialized: isAdmin || isSuperAdmin ? true : isInitialized,
    }),
    [isAvailable, isInitialized, isLoading, isAdmin, isSuperAdmin],
  );
}

/**
 * Check if NSFW content is available
 * Uses optional context to avoid throwing when rendered outside DLCProvider
 */
export function useNSFWAvailable() {
  const ctx = useOptionalDLC();

  return useMemo(() => {
    // If no context, return safe defaults
    if (!ctx) {
      return {
        isAvailable: false,
        requiresAgeVerification: true,
        requiresDLC: true,
        isLoading: false,
      };
    }

    const { ownedPackages, installedPackages, isAgeVerified, isInitialized, isLoading } = ctx;

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
  }, [ctx]);
}
