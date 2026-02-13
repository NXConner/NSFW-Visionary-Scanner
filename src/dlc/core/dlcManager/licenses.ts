import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { serializeDLCLicense } from "../serializers";
import type { DLCLicense, LicenseValidationResult } from "../types";
import { CACHE_KEY_LICENSES } from "./cacheKeys";
import { asDate, getLocalStorageJson, setLocalStorageJson } from "./storage";

export async function loadLicenses(licenses: Map<string, DLCLicense>): Promise<void> {
  licenses.clear();
  
  try {
    // Use a timeout to prevent hanging if auth is slow
    const getUserPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) => 
      setTimeout(() => resolve({ data: { user: null } }), 3000)
    );
    
    const { data: { user } } = await Promise.race([getUserPromise, timeoutPromise]);

    if (!user) {
      logger.info("DLCManager: No user, skipping license load");
      loadLicensesFromCache(licenses);
      return;
    }

    const { data, error } = await supabase.from("dlc_licenses").select("*").eq("user_id", user.id);
    if (error) {
      logger.warn("DLCManager: Failed to load licenses from DB, using cache", {
        error: error.message,
      });
      loadLicensesFromCache(licenses);
      return;
    }

    (data || [])
      .map(serializeDLCLicense)
      .filter(l => l.isActive)
      .forEach(license => {
        if (license.packageId) licenses.set(license.packageId, license);
      });

    saveLicensesToCache(licenses);
    logger.info(`DLCManager: Loaded ${licenses.size} licenses`);
  } catch (error) {
    logger.error("DLCManager: Failed to load licenses", { error });
    loadLicensesFromCache(licenses);
  }
}

export function validateLicenseLocally(license: DLCLicense): LicenseValidationResult {
  if (!license.isActive) {
    return { isValid: false, license, error: "license_revoked", deviceAuthorized: false };
  }

  if (license.licenseType === "subscription" && license.subscriptionEnd) {
    const now = new Date();
    const expirationDate = new Date(license.subscriptionEnd);
    if (now > expirationDate) {
      if (license.gracePeriodUntil) {
        const grace = new Date(license.gracePeriodUntil);
        if (now > grace)
          return {
            isValid: false,
            license,
            error: "subscription_expired",
            deviceAuthorized: false,
          };
      } else {
        return { isValid: false, license, error: "subscription_expired", deviceAuthorized: false };
      }
    }
  }

  const offlineValid = isOfflineValid(license);
  return {
    isValid: true,
    license,
    deviceAuthorized: true,
    expiresAt: license.subscriptionEnd ? new Date(license.subscriptionEnd) : undefined,
    offlineValidUntil: offlineValid ? license.offlineCacheExpiresAt : undefined,
  };
}

export function isOfflineValid(license: DLCLicense): boolean {
  if (!license.offlineCacheExpiresAt) return false;
  const now = new Date();
  const cacheExpiry = new Date(license.offlineCacheExpiresAt);
  return now < cacheExpiry;
}

export async function activateLicense(
  deviceId: string,
  licenseKey: string,
  licenses: Map<string, DLCLicense>,
): Promise<{ success: boolean; packageId?: string; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Please sign in to activate a license" };

    logger.info("DLCManager: Activating license", { prefix: `${licenseKey.substring(0, 4)}...` });

    const { data, error } = await supabase.functions.invoke("verify-dlc-license", {
      body: { licenseKey, userId: user.id, deviceId },
    });
    if (error) {
      logger.warn("DLCManager: License verification function failed, falling back to DB lookup", {
        error: error.message,
      });
    }

    await loadLicenses(licenses);

    const pkgIdFromFn = (data as { license?: { packageId?: unknown } } | null)?.license?.packageId;
    if (typeof pkgIdFromFn === "string" && pkgIdFromFn)
      return { success: true, packageId: pkgIdFromFn };

    const { data: row, error: fetchError } = await supabase
      .from("dlc_licenses")
      .select("*")
      .eq("license_key", licenseKey)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError)
      return {
        success: false,
        error: "License activated but could not be loaded. Please refresh.",
      };

    const license = row ? serializeDLCLicense(row) : null;
    return { success: true, packageId: license?.packageId };
  } catch (error) {
    logger.error("DLCManager: License activation failed", { error });
    return { success: false, error: "Activation failed" };
  }
}

export function saveLicensesToCache(licenses: Map<string, DLCLicense>): void {
  try {
    setLocalStorageJson(CACHE_KEY_LICENSES, Array.from(licenses.values()));
  } catch {
    // ignore
  }
}

export function loadLicensesFromCache(licenses: Map<string, DLCLicense>): void {
  try {
    const stored =
      getLocalStorageJson<DLCLicense[]>(CACHE_KEY_LICENSES) ||
      getLocalStorageJson<DLCLicense[]>("dlc_licenses");
    if (!stored) return;

    stored.forEach(license => {
      const purchaseDate = asDate((license as unknown as { purchaseDate?: unknown }).purchaseDate);
      if (purchaseDate) (license as unknown as { purchaseDate: Date }).purchaseDate = purchaseDate;

      const createdAt = asDate((license as unknown as { createdAt?: unknown }).createdAt);
      if (createdAt) (license as unknown as { createdAt: Date }).createdAt = createdAt;

      const updatedAt = asDate((license as unknown as { updatedAt?: unknown }).updatedAt);
      if (updatedAt) (license as unknown as { updatedAt: Date }).updatedAt = updatedAt;

      const subscriptionEnd = asDate(
        (license as unknown as { subscriptionEnd?: unknown }).subscriptionEnd,
      );
      if (subscriptionEnd)
        (license as unknown as { subscriptionEnd: Date }).subscriptionEnd = subscriptionEnd;

      const offlineCacheExpiresAt = asDate(
        (license as unknown as { offlineCacheExpiresAt?: unknown }).offlineCacheExpiresAt,
      );
      if (offlineCacheExpiresAt)
        (license as unknown as { offlineCacheExpiresAt: Date }).offlineCacheExpiresAt =
          offlineCacheExpiresAt;

      if (license.isActive && license.packageId) licenses.set(license.packageId, license);
    });
  } catch {
    // ignore
  }
}
