import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { DLCLicense, LicenseValidationResult } from "./types";

const asString = (value: unknown): string => (value == null ? "" : String(value));

const mapLicense = (row: Record<string, unknown>): DLCLicense => {
  return {
    id: asString(row.id),
    userId: asString(row.user_id),
    packageId: row.package_id ? asString(row.package_id) : null,
    licenseKey: asString(row.license_key),
    purchaseDate: row.purchase_date ? asString(row.purchase_date) : null,
    expirationDate: row.expires_at ? asString(row.expires_at) : null,
    subscriptionEnd: row.subscription_end ? asString(row.subscription_end) : null,
    deviceId: row.device_id ? asString(row.device_id) : null,
    contentVersion: row.content_version ? asString(row.content_version) : null,
    signature: row.signature ? asString(row.signature) : null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? asString(row.created_at) : null,
    updatedAt: row.updated_at ? asString(row.updated_at) : null,
  };
};

class LicenseValidator {
  async getLicenses(): Promise<DLCLicense[]> {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];

      const { data, error } = await supabase
        .from("dlc_licenses")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        logger.warn("LicenseValidator: Failed to load licenses", { error: error.message });
        return [];
      }

      return (data || []).map(row => mapLicense(row as Record<string, unknown>));
    } catch (error) {
      logger.warn("LicenseValidator: License fetch failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  async validateExistingLicense(packageId?: string): Promise<LicenseValidationResult> {
    const licenses = await this.getLicenses();
    if (licenses.length === 0) {
      return { success: false, error: "No active licenses found" };
    }

    const match =
      packageId && licenses.find(l => l.packageId === packageId && l.isActive)
        ? licenses.find(l => l.packageId === packageId && l.isActive)
        : licenses.find(l => l.isActive);

    if (!match) {
      return { success: false, error: "No active license for package" };
    }

    return { success: true, packageId: match.packageId ?? undefined, license: match };
  }

  async activateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      const { data, error } = await supabase.functions.invoke("verify-dlc-license", {
        body: { licenseKey },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const license = (data as { license?: Record<string, unknown> } | null)?.license;
      if (!license) {
        return { success: false, error: "License verification failed" };
      }

      const mapped = {
        id: asString(license.id),
        userId: asString(license.userId ?? license.user_id),
        packageId: license.packageId ? asString(license.packageId) : null,
        licenseKey: asString(license.licenseKey ?? license.license_key),
        purchaseDate: license.purchaseDate ? asString(license.purchaseDate) : null,
        expirationDate: license.expirationDate ? asString(license.expirationDate) : null,
        subscriptionEnd: license.subscriptionEnd ? asString(license.subscriptionEnd) : null,
        deviceId: license.deviceId ? asString(license.deviceId) : null,
        contentVersion: license.contentVersion ? asString(license.contentVersion) : null,
        signature: license.signature ? asString(license.signature) : null,
        isActive: Boolean(license.isActive ?? license.is_active),
        createdAt: license.createdAt ? asString(license.createdAt) : null,
        updatedAt: license.updatedAt ? asString(license.updatedAt) : null,
      } as DLCLicense;

      return {
        success: true,
        packageId: mapped.packageId ?? undefined,
        license: mapped,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "License activation failed",
      };
    }
  }
}

export const licenseValidator = new LicenseValidator();
