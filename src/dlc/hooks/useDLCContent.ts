/**
 * DLC Content Hooks
 * React hooks for accessing DLC content
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDLC, useDLCFeature, useNSFWAvailable } from "../context/DLCContext";
import { dlcRegistry } from "../core/DLCRegistry";
import type {
  DLCPackage,
  DLCFeature,
  DLCFeatureCategory,
  DownloadProgress,
  DLCUpdate,
} from "../core/types";

// ============================================
// Package Hooks
// ============================================

/**
 * Get all available DLC packages
 */
export function useDLCPackages() {
  const { packages, isLoading, error } = useDLC();

  return useMemo(
    () => ({
      packages,
      isLoading,
      error,
    }),
    [packages, isLoading, error],
  );
}

/**
 * Get featured DLC packages
 */
export function useFeaturedPackages() {
  const { featuredPackages, isLoading } = useDLC();

  return useMemo(
    () => ({
      packages: featuredPackages,
      isLoading,
    }),
    [featuredPackages, isLoading],
  );
}

/**
 * Get owned DLC packages
 */
export function useOwnedPackages() {
  const { ownedPackages, isLoading } = useDLC();

  return useMemo(
    () => ({
      packages: ownedPackages,
      isLoading,
    }),
    [ownedPackages, isLoading],
  );
}

/**
 * Get installed DLC packages
 */
export function useInstalledPackages() {
  const { installedPackages, isLoading } = useDLC();

  return useMemo(
    () => ({
      packages: installedPackages,
      isLoading,
    }),
    [installedPackages, isLoading],
  );
}

/**
 * Get a single DLC package by ID
 */
export function usePackage(packageId: string) {
  const { packages, ownsPackage, isPackageInstalled, calculateUpgradePrice } = useDLC();

  return useMemo(() => {
    const pkg = packages.find(p => p.packageId === packageId);

    return {
      package: pkg,
      isOwned: ownsPackage(packageId),
      isInstalled: isPackageInstalled(packageId),
      upgradePrice: calculateUpgradePrice(packageId),
      features: pkg ? dlcRegistry.getAllFeaturesForPackage(packageId) : [],
    };
  }, [packageId, packages, ownsPackage, isPackageInstalled, calculateUpgradePrice]);
}

// ============================================
// Feature Hooks
// ============================================

/**
 * Get all available features
 */
export function useAllFeatures() {
  const { packages } = useDLC();

  return useMemo(() => {
    const featureMap = new Map<string, DLCFeature>();

    packages.forEach(pkg => {
      pkg.features.forEach(feature => {
        if (!featureMap.has(feature.id)) {
          featureMap.set(feature.id, feature);
        }
      });
    });

    return Array.from(featureMap.values());
  }, [packages]);
}

/**
 * Get features by category
 */
export function useFeaturesByCategory(category: DLCFeatureCategory) {
  const allFeatures = useAllFeatures();

  return useMemo(() => allFeatures.filter(f => f.category === category), [allFeatures, category]);
}

/**
 * Check if multiple features are available
 */
export function useMultipleFeatures(featureIds: string[]) {
  const { hasFeature, isInitialized, isLoading } = useDLC();

  return useMemo(
    () => ({
      features: featureIds.map(id => ({
        id,
        isAvailable: hasFeature(id),
      })),
      allAvailable: featureIds.every(id => hasFeature(id)),
      anyAvailable: featureIds.some(id => hasFeature(id)),
      isInitialized,
      isLoading,
    }),
    [featureIds, hasFeature, isInitialized, isLoading],
  );
}

// ============================================
// Download Hooks
// ============================================

/**
 * Track download progress for a package
 */
export function useDownloadProgress(packageId: string) {
  const { getDownloadProgress } = useDLC();
  const [progress, setProgress] = useState<DownloadProgress | undefined>();

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getDownloadProgress(packageId);
      setProgress(current);
    }, 500);

    return () => clearInterval(interval);
  }, [packageId, getDownloadProgress]);

  return progress;
}

/**
 * Track all active downloads
 */
export function useActiveDownloads() {
  const { getActiveDownloads } = useDLC();
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getActiveDownloads();
      setDownloads(current);
    }, 500);

    return () => clearInterval(interval);
  }, [getActiveDownloads]);

  return downloads;
}

// ============================================
// Update Hooks
// ============================================

/**
 * Check for and manage DLC updates
 */
export function useDLCUpdates() {
  const { checkForUpdates, availableUpdates } = useDLC();
  const [isChecking, setIsChecking] = useState(false);

  const refresh = useCallback(async () => {
    setIsChecking(true);
    try {
      await checkForUpdates();
    } finally {
      setIsChecking(false);
    }
  }, [checkForUpdates]);

  return useMemo(
    () => ({
      updates: availableUpdates,
      hasUpdates: availableUpdates.length > 0,
      isChecking,
      refresh,
    }),
    [availableUpdates, isChecking, refresh],
  );
}

// ============================================
// Age Verification Hook
// ============================================

/**
 * Manage age verification
 */
export function useAgeVerification() {
  const { isAgeVerified, verifyAge } = useDLC();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const verify = useCallback(
    async (age: number, consent: boolean) => {
      setIsVerifying(true);
      setVerificationError(null);

      try {
        if (age < 18) {
          setVerificationError("You must be 18 or older");
          return false;
        }

        if (!consent) {
          setVerificationError("Consent is required");
          return false;
        }

        const result = await verifyAge(age, consent);

        if (!result) {
          setVerificationError("Verification failed");
        }

        return result;
      } finally {
        setIsVerifying(false);
      }
    },
    [verifyAge],
  );

  return useMemo(
    () => ({
      isVerified: isAgeVerified,
      isVerifying,
      error: verificationError,
      verify,
    }),
    [isAgeVerified, isVerifying, verificationError, verify],
  );
}

// ============================================
// Update Source Hook
// ============================================

/**
 * Manage update source preference
 */
export function useUpdateSource() {
  const {
    updateSource,
    isUpdateSourceAcknowledged,
    acknowledgeUpdateSourceChange,
    installedPackages,
  } = useDLC();

  const mustUseWebsite = installedPackages.length > 0;
  const showWarning = mustUseWebsite && !isUpdateSourceAcknowledged;

  return useMemo(
    () => ({
      source: updateSource,
      isWebsiteRequired: mustUseWebsite,
      isAcknowledged: isUpdateSourceAcknowledged,
      showWarning,
      acknowledge: acknowledgeUpdateSourceChange,
    }),
    [
      updateSource,
      mustUseWebsite,
      isUpdateSourceAcknowledged,
      showWarning,
      acknowledgeUpdateSourceChange,
    ],
  );
}

// ============================================
// License Hook
// ============================================

/**
 * Activate a license key
 */
export function useLicenseActivation() {
  const { activateLicense } = useDLC();
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activatedPackageId, setActivatedPackageId] = useState<string | null>(null);

  const activate = useCallback(
    async (licenseKey: string) => {
      setIsActivating(true);
      setActivationError(null);
      setActivatedPackageId(null);

      try {
        const result = await activateLicense(licenseKey);

        if (result.success) {
          setActivatedPackageId(result.packageId || null);
        } else {
          setActivationError(result.error || "Activation failed");
        }

        return result;
      } finally {
        setIsActivating(false);
      }
    },
    [activateLicense],
  );

  return useMemo(
    () => ({
      activate,
      isActivating,
      error: activationError,
      activatedPackageId,
    }),
    [activate, isActivating, activationError, activatedPackageId],
  );
}

// ============================================
// Content Availability Hooks
// ============================================

/**
 * Check if positions content is available
 */
export function usePositionsAvailable() {
  return useDLCFeature("positions_gallery");
}

/**
 * Check if video content is available
 */
export function useVideosAvailable() {
  return useDLCFeature("video_library");
}

/**
 * Check if analytics features are available
 */
export function useAnalyticsAvailable() {
  return useDLCFeature("wellness_analytics");
}

/**
 * Check if community features are available
 */
export function useCommunityAvailable() {
  return useDLCFeature("private_forum");
}

/**
 * Check if advanced features are available
 */
export function useAdvancedFeaturesAvailable() {
  return useDLCFeature("multi_camera");
}

// Re-export context hooks
export { useDLC, useDLCFeature, useNSFWAvailable, useDLCPackage } from "../context/DLCContext";
