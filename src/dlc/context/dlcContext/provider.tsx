import React, { useCallback, useMemo } from "react";

import { dlcManager, dlcRegistry } from "@/dlc/core";
import type {
  DLCPackage,
  DLCLicense,
  DLCInstallation,
  DLCUpdate,
  DownloadProgress,
  LicenseValidationResult,
} from "@/dlc/core/types";

import { DLCContext } from "./context";
import type { DLCContextValue, DLCProviderProps } from "./types";
import { useDlcAdminAccess } from "./hooks/useDlcAdminAccess";
import { useDlcPackages } from "./hooks/useDlcPackages";
import { useDlcStoreRuntime } from "./hooks/useDlcStoreRuntime";

export function DLCProvider({ children }: DLCProviderProps): React.ReactElement {
  const {
    isInitialized,
    isLoading,
    error,
    storeState,
    availableUpdates,
    refreshStore,
    checkForUpdates,
  } = useDlcStoreRuntime();

  const { packages, isAdultPackage } = useDlcPackages(storeState);

  const { adminOverrideActive, isAgeVerified, verifyAge, isAdminPackageEnabled, loadAdminToggles } =
    useDlcAdminAccess({ isAdultPackage });

  const refresh = useCallback(async (): Promise<void> => {
    await refreshStore();
    await loadAdminToggles();
  }, [loadAdminToggles, refreshStore]);

  // Package lists
  const featuredPackages = useMemo(() => packages.filter(p => p.isFeatured), [packages]);

  const ownedPackages = useMemo(() => {
    if (adminOverrideActive) return packages.filter(p => isAdminPackageEnabled(p.packageId));
    return packages.filter(p => storeState?.ownedPackages.includes(p.packageId));
  }, [adminOverrideActive, isAdminPackageEnabled, packages, storeState]);

  const installedPackages = useMemo(() => {
    if (adminOverrideActive) return packages.filter(p => isAdminPackageEnabled(p.packageId));
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
      return true;
    },
    [adminOverrideActive],
  );

  // License operations
  const getLicense = useCallback((packageId: string) => dlcManager.getLicense(packageId), []);

  const validateLicense = useCallback(
    async (packageId: string): Promise<LicenseValidationResult> =>
      dlcManager.validateLicense(packageId),
    [],
  );

  const activateLicense = useCallback(
    async (licenseKey: string) => {
      const result = await dlcManager.activateLicense(licenseKey);
      if (result.success) await refresh();
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
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const uninstallPackage = useCallback(
    async (packageId: string) => {
      const result = await dlcManager.uninstallPackage(packageId);
      if (result.success) await refresh();
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
  const checkForUpdatesFn = useCallback(async (): Promise<DLCUpdate[]> => {
    return checkForUpdates();
  }, [checkForUpdates]);

  // Update source
  const updateSource = dlcManager.getUpdateSource();
  const isUpdateSourceAcknowledged = dlcManager.isUpdateSourceAcknowledged();

  const acknowledgeUpdateSourceChange = useCallback(() => {
    dlcManager.acknowledgeUpdateSourceChange();
    void refresh();
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

      getLicense: getLicense as (packageId: string) => DLCLicense | undefined,
      validateLicense,
      activateLicense,

      getInstallation: getInstallation as (packageId: string) => DLCInstallation | undefined,
      installPackage,
      uninstallPackage,

      getDownloadProgress: getDownloadProgress as (
        packageId: string,
      ) => DownloadProgress | undefined,
      getActiveDownloads,

      checkForUpdates: checkForUpdatesFn,
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
      acknowledgeUpdateSourceChange,
      activateLicense,
      availableUpdates,
      calculateUpgradePrice,
      checkForUpdatesFn,
      error,
      featuredPackages,
      getActiveDownloads,
      getDownloadProgress,
      getInstallation,
      getLicense,
      getRegionalPrice,
      hasFeature,
      installPackage,
      installedPackages,
      isAgeVerified,
      isInitialized,
      isLoading,
      isPackageInstalled,
      isUpdateSourceAcknowledged,
      ownsPackage,
      ownedPackages,
      packages,
      refresh,
      uninstallPackage,
      updateSource,
      validateLicense,
      verifyAge,
    ],
  );

  return <DLCContext.Provider value={value}>{children}</DLCContext.Provider>;
}
