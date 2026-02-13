import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type {
  DLCInstallation,
  DLCLicense,
  DLCPackage,
  DevicePlatform,
  DLCRegistry,
  LicenseValidationResult,
} from "../types";
import { serializeDLCInstallation } from "../serializers";
import { CACHE_KEY_INSTALLATIONS } from "./cacheKeys";
import { asDate, getLocalStorageJson, setLocalStorageJson } from "./storage";

export async function loadInstallations(
  installations: Map<string, DLCInstallation>,
  deviceId: string,
): Promise<void> {
  installations.clear();
  loadInstallationsFromCache(installations, deviceId);

  try {
    // Best-effort DB load (requires auth). Keep cache fallback.
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 2500),
    );
    const {
      data: { user },
    } = await Promise.race([getUserPromise, timeoutPromise]);

    if (!user) {
      logger.info(`DLCManager: Loaded ${installations.size} installations from cache (no user)`);
      return;
    }
     
    const { data, error } = await (supabase as any)
      .from("dlc_installations")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_id", deviceId)
      .eq("is_installed", true);
    if (error || !data) {
      logger.warn("DLCManager: Failed to load installations from DB, using cache", {
        error: error?.message,
      });
      return;
    }

    installations.clear();
    (data || [])
      .map(serializeDLCInstallation)
      .filter((i) => i.isInstalled && i.deviceId === deviceId)
      .forEach((i) => installations.set(i.packageId, i));

    saveInstallationsToCache(installations);
    logger.info(`DLCManager: Loaded ${installations.size} installations from DB`);
  } catch (error) {
    logger.warn("DLCManager: Failed to load installations from DB, using cache", { error });
  }
}

export function saveInstallationsToCache(installations: Map<string, DLCInstallation>): void {
  try {
    setLocalStorageJson(CACHE_KEY_INSTALLATIONS, Array.from(installations.values()));
  } catch {
    // ignore
  }
}

export function loadInstallationsFromCache(
  installations: Map<string, DLCInstallation>,
  deviceId: string,
): void {
  try {
    const stored =
      getLocalStorageJson<DLCInstallation[]>(CACHE_KEY_INSTALLATIONS) ||
      getLocalStorageJson<DLCInstallation[]>("dlc_installations");
    if (!stored) return;
    stored.forEach(installation => {
      const installDate = asDate(
        (installation as unknown as { installDate?: unknown }).installDate,
      );
      if (installDate) (installation as unknown as { installDate: Date }).installDate = installDate;

      const createdAt = asDate((installation as unknown as { createdAt?: unknown }).createdAt);
      if (createdAt) (installation as unknown as { createdAt: Date }).createdAt = createdAt;

      const updatedAt = asDate((installation as unknown as { updatedAt?: unknown }).updatedAt);
      if (updatedAt) (installation as unknown as { updatedAt: Date }).updatedAt = updatedAt;

      const lastIntegrityCheck = asDate(
        (installation as unknown as { lastIntegrityCheck?: unknown }).lastIntegrityCheck,
      );
      if (lastIntegrityCheck)
        (installation as unknown as { lastIntegrityCheck: Date }).lastIntegrityCheck =
          lastIntegrityCheck;

      if (installation.isInstalled && installation.deviceId === deviceId) {
        installations.set(installation.packageId, installation);
      }
    });
  } catch {
    // ignore
  }
}

export async function installPackageLocal(params: {
  registry: DLCRegistry;
  packageId: string;
  deviceId: string;
  platform: DevicePlatform;
  licenses: Map<string, DLCLicense>;
  installations: Map<string, DLCInstallation>;
  ownsPackage: (id: string) => boolean;
  validateLicense: (id: string) => Promise<LicenseValidationResult>;
  getPackage: (id: string) => DLCPackage | undefined;
}): Promise<{ success: boolean; error?: string }> {
  const {
    registry,
    packageId,
    deviceId,
    platform,
    licenses,
    installations,
    ownsPackage,
    validateLicense,
    getPackage,
  } = params;

  try {
    if (!ownsPackage(packageId)) return { success: false, error: "License required" };

    const validation = await validateLicense(packageId);
    if (!validation.isValid)
      return { success: false, error: validation.error || "Invalid license" };

    const pkg = registry.getPackage(packageId);
    if (!pkg) return { success: false, error: "Package not found" };

    const license = licenses.get(packageId);
    if (!license) return { success: false, error: "License not found" };

    logger.info("DLCManager: Installing package", { packageId });

    const installation: DLCInstallation = {
      id: crypto.randomUUID(),
      userId: license.userId,
      licenseId: license.id,
      packageId,
      deviceId,
      installedVersion: pkg.version,
      contentVersion: pkg.contentVersion,
      installDate: new Date(),
      installSource: "manual",
      devicePlatform: platform,
      appVersion: "1.0.0",
      isInstalled: true,
      isCorrupted: false,
      lastIntegrityCheck: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    installations.set(packageId, installation);
    saveInstallationsToCache(installations);

    // Persist installation state to DB if possible (non-fatal if offline).
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
         
        await (supabase as any).from("dlc_installations").upsert(
          {
            user_id: user.id,
            license_id: license.id,
            package_id: packageId,
            device_id: deviceId,
            installed_version: pkg.version,
            content_version: pkg.contentVersion ?? null,
            install_date: installation.installDate.toISOString(),
            install_source: "manual",
            device_platform: platform,
            app_version: installation.appVersion ?? null,
            is_installed: true,
            is_corrupted: false,
            last_integrity_check: installation.lastIntegrityCheck?.toISOString() ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,package_id,device_id" },
        );
      }
    } catch {
      // ignore
    }

    if (pkg.includedPackages) {
      for (const includedId of pkg.includedPackages) {
        if (installations.has(includedId)) continue;
        const includedPkg = getPackage(includedId);
        if (!includedPkg) continue;
        const includedInstallation: DLCInstallation = {
          ...installation,
          id: crypto.randomUUID(),
          packageId: includedId,
          installedVersion: includedPkg.version,
          contentVersion: includedPkg.contentVersion,
        };
        installations.set(includedId, includedInstallation);
      }
      saveInstallationsToCache(installations);

      // Best-effort DB upsert for included packages
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          for (const includedId of pkg.includedPackages) {
            const includedPkg = getPackage(includedId);
            if (!includedPkg) continue;
             
            await (supabase as any).from("dlc_installations").upsert(
              {
                user_id: user.id,
                license_id: license.id,
                package_id: includedId,
                device_id: deviceId,
                installed_version: includedPkg.version,
                content_version: includedPkg.contentVersion ?? null,
                install_date: new Date().toISOString(),
                install_source: "manual",
                device_platform: platform,
                is_installed: true,
                is_corrupted: false,
                last_integrity_check: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,package_id,device_id" },
            );
          }
        }
      } catch {
        // ignore
      }
    }

    logger.info("DLCManager: Package installed", { packageId });
    return { success: true };
  } catch (error) {
    logger.error("DLCManager: Installation failed", { error });
    return { success: false, error: "Installation failed" };
  }
}

export async function uninstallPackageLocal(params: {
  packageId: string;
  deviceId: string;
  installations: Map<string, DLCInstallation>;
  clearPackageCache: (packageId: string) => Promise<void>;
}): Promise<{ success: boolean; error?: string }> {
  const { packageId, installations, clearPackageCache } = params;
  try {
    const installation = installations.get(packageId);
    if (!installation) return { success: false, error: "Package not installed" };

    logger.info("DLCManager: Uninstalling package", { packageId });
    installations.delete(packageId);
    saveInstallationsToCache(installations);
    await clearPackageCache(packageId);

    // Best-effort DB mark as uninstalled
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
         
        await (supabase as any)
          .from("dlc_installations")
          .update({ is_installed: false, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("package_id", packageId)
          .eq("device_id", params.deviceId);
      }
    } catch {
      // ignore
    }

    logger.info("DLCManager: Package uninstalled", { packageId });
    return { success: true };
  } catch (error) {
    logger.error("DLCManager: Uninstall failed", { error });
    return { success: false, error: "Uninstall failed" };
  }
}
