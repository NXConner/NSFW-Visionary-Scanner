import { logger } from "@/lib/logger";
import type { DLCLicense, LicenseValidationResult } from "../types";
import { OFFLINE_CACHE_DURATION_MS, VALIDATION_INTERVAL_MS } from "./constants";

export interface CachedLicense {
  license: DLCLicense;
  validationResult: LicenseValidationResult;
  cachedAt: Date;
  expiresAt: Date;
  offlineValidUntil: Date;
}

export class LicenseCache {
  private cache: Map<string, CachedLicense> = new Map();
  private storageKey = "dlc_license_cache";

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;
      const data = JSON.parse(stored) as Record<string, CachedLicense>;
      Object.entries(data).forEach(([key, value]) => {
        value.cachedAt = new Date(value.cachedAt);
        value.expiresAt = new Date(value.expiresAt);
        value.offlineValidUntil = new Date(value.offlineValidUntil);
        value.license.purchaseDate = new Date(value.license.purchaseDate);
        value.license.createdAt = new Date(value.license.createdAt);
        value.license.updatedAt = new Date(value.license.updatedAt);
        if (new Date() < value.offlineValidUntil) this.cache.set(key, value);
      });
    } catch (error) {
      logger.warn("LicenseCache: Failed to load from storage", { error });
    }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, CachedLicense> = {};
      this.cache.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.warn("LicenseCache: Failed to save to storage", { error });
    }
  }

  get(packageId: string): CachedLicense | undefined {
    const cached = this.cache.get(packageId);
    if (!cached) return undefined;

    if (new Date() > cached.expiresAt && new Date() > cached.offlineValidUntil) {
      this.cache.delete(packageId);
      this.saveToStorage();
      return undefined;
    }

    return cached;
  }

  set(packageId: string, license: DLCLicense, result: LicenseValidationResult): void {
    const now = new Date();
    this.cache.set(packageId, {
      license,
      validationResult: result,
      cachedAt: now,
      expiresAt: new Date(now.getTime() + VALIDATION_INTERVAL_MS),
      offlineValidUntil: new Date(now.getTime() + OFFLINE_CACHE_DURATION_MS),
    });
    this.saveToStorage();
  }

  remove(packageId: string): void {
    this.cache.delete(packageId);
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem(this.storageKey);
  }

  isOfflineValid(packageId: string): boolean {
    const cached = this.cache.get(packageId);
    if (!cached) return false;
    return new Date() < cached.offlineValidUntil;
  }
}
