import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { getDeviceId } from "./device";
import type { DLCLicense, LicenseValidationResult } from "./types";

function isExpired(license: DLCLicense): boolean {
  if (!license.subscriptionEnd) return false;
  const now = Date.now();
  const exp = license.subscriptionEnd.getTime();
  if (now <= exp) return false;
  // Grace period if present
  if (license.gracePeriodUntil && now <= license.gracePeriodUntil.getTime()) return false;
  return true;
}

export class LicenseValidator {
  /**
   * Local/offline validation (no network calls).
   * Use edge function verification for device binding enforcement.
   */
  validateLocal(license: DLCLicense): LicenseValidationResult {
    if (!license.isActive) {
      return { isValid: false, license, error: "license_revoked", deviceAuthorized: false };
    }

    if (isExpired(license)) {
      return { isValid: false, license, error: "subscription_expired", deviceAuthorized: false };
    }

    return {
      isValid: true,
      license,
      deviceAuthorized: true,
      expiresAt: license.subscriptionEnd,
      offlineValidUntil: license.offlineCacheExpiresAt,
    };
  }

  /**
   * Server-side verification (enforces age gate, device binding, revocation flags).
   * This is heavier and should be called sparingly.
   */
  async verifyWithServer(licenseKey: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const key = String(licenseKey || "").trim().toUpperCase();
      if (!key) return { ok: false, error: "Missing license key" };

      const deviceId = getDeviceId();
      const { data, error } = await supabase.functions.invoke("verify-dlc-license", {
        body: { licenseKey: key, deviceId },
      });
      if (error) return { ok: false, error: error.message };
      if (!data?.valid) return { ok: false, error: "License verification failed" };
      return { ok: true };
    } catch (err) {
      logger.warn("[dlc] verifyWithServer failed", { error: err });
      return { ok: false, error: "Network error" };
    }
  }
}

export const licenseValidator = new LicenseValidator();

