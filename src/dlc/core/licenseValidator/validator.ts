import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { DLCLicense, LicenseValidationError, LicenseValidationResult } from "../types";
import { LicenseCache } from "./cache";
import { DeviceManager } from "./deviceManager";
import {
  GRACE_PERIOD_DURATION_MS,
  OFFLINE_CACHE_DURATION_MS,
  VALIDATION_INTERVAL_MS,
} from "./constants";

export class LicenseValidator {
  private cache: LicenseCache;
  private deviceManager: DeviceManager;
  private isOnline: boolean = true;

  constructor() {
    this.cache = new LicenseCache();
    this.deviceManager = new DeviceManager();

    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      window.addEventListener("online", () => {
        this.isOnline = true;
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
      });
    }
  }

  async validate(license: DLCLicense): Promise<LicenseValidationResult> {
    const packageId = license.packageId;

    const cached = this.cache.get(packageId);
    if (cached && new Date() < cached.expiresAt) {
      logger.debug("LicenseValidator: Using cached validation", { packageId });
      return cached.validationResult;
    }

    if (!this.isOnline) return this.validateOffline(license);
    return await this.validateOnline(license);
  }

  private async validateOnline(license: DLCLicense): Promise<LicenseValidationResult> {
    const packageId = license.packageId;

    try {
      if (!license.isActive) return this.createResult(false, license, "license_revoked", false);

      if (license.licenseType === "subscription") {
        const subResult = this.checkSubscription(license);
        if (!subResult.isValid) return subResult;
      }

      const deviceResult = await this.checkDevice(license);
      if (!deviceResult.success) {
        return this.createResult(
          false,
          license,
          deviceResult.error as LicenseValidationError,
          false,
        );
      }

      const result = this.createResult(true, license, undefined, true);
      this.cache.set(packageId, license, result);

      license.lastOnlineValidation = new Date();
      license.offlineCacheExpiresAt = new Date(Date.now() + OFFLINE_CACHE_DURATION_MS);

      return result;
    } catch (error) {
      logger.error("LicenseValidator: Online validation failed", { error });
      return this.validateOffline(license);
    }
  }

  private validateOffline(license: DLCLicense): LicenseValidationResult {
    const packageId = license.packageId;
    const cached = this.cache.get(packageId);
    if (cached && this.cache.isOfflineValid(packageId)) {
      logger.debug("LicenseValidator: Using offline cached validation", { packageId });
      return cached.validationResult;
    }

    if (!license.offlineCacheExpiresAt)
      return this.createResult(false, license, "network_error", false);
    if (new Date() > new Date(license.offlineCacheExpiresAt))
      return this.createResult(false, license, "license_expired", false);

    return this.createResult(
      true,
      license,
      undefined,
      true,
      new Date(license.offlineCacheExpiresAt),
    );
  }

  private checkSubscription(license: DLCLicense): LicenseValidationResult {
    if (!license.subscriptionEnd) return this.createResult(true, license, undefined, true);
    const now = new Date();
    const end = new Date(license.subscriptionEnd);

    if (now <= end) return this.createResult(true, license, undefined, true);

    if (!license.gracePeriodUntil) {
      license.gracePeriodUntil = new Date(end.getTime() + GRACE_PERIOD_DURATION_MS);
    }

    if (now > new Date(license.gracePeriodUntil)) {
      return this.createResult(false, license, "subscription_expired", false);
    }

    return this.createResult(true, license, undefined, true, new Date(license.gracePeriodUntil));
  }

  private async checkDevice(license: DLCLicense): Promise<{ success: boolean; error?: string }> {
    // dlc_license_devices table doesn't exist in current schema - use local device manager only
    try {
      // If already registered locally, ok.
      if (this.deviceManager.isDeviceRegistered(license.id)) return { success: true };

      const result = await this.deviceManager.registerDevice(license.id, license.maxDevices);
      if (!result.success) return { success: false, error: "max_devices_reached" };
      return { success: true };
    } catch {
      // Fallback to local register
      const fallback = await this.deviceManager.registerDevice(license.id, license.maxDevices);
      if (!fallback.success) return { success: false, error: "max_devices_reached" };
      return { success: true };
    }
  }

  private createResult(
    isValid: boolean,
    license: DLCLicense,
    error?: LicenseValidationError,
    deviceAuthorized: boolean = false,
    offlineValidUntil?: Date,
  ): LicenseValidationResult {
    return {
      isValid,
      license,
      error,
      deviceAuthorized,
      expiresAt: license.subscriptionEnd ? new Date(license.subscriptionEnd) : undefined,
      offlineValidUntil:
        offlineValidUntil ||
        (license.offlineCacheExpiresAt ? new Date(license.offlineCacheExpiresAt) : undefined),
      checkAgainAt: new Date(Date.now() + VALIDATION_INTERVAL_MS),
    };
  }

  getDeviceManager(): DeviceManager {
    return this.deviceManager;
  }

  clearCache(): void {
    this.cache.clear();
  }

  isNetworkAvailable(): boolean {
    return this.isOnline;
  }
}

export const licenseValidator = new LicenseValidator();
