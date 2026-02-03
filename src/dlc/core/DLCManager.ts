import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { getDistributionChannel } from "@/lib/featureFlags";
import { dlcRegistry } from "./DLCRegistry";
import { licenseValidator } from "./LicenseValidator";
import { downloadManager } from "./DownloadManager";
import type {
  DLCPackage,
  DLCLicense,
  DLCInstallation,
  DLCStoreState,
  DLCUpdate,
  LicenseValidationResult,
} from "./types";
import { getDLCUpdates } from "@/lib/enhancedDLCSystem";

const LOCAL_INSTALLED_KEY = "dlc_installed_packages_v1";
const UPDATE_SOURCE_KEY = "dlc_update_source_v1";
const UPDATE_SOURCE_ACK_KEY = "dlc_update_source_ack_v1";

const safeLocalStorage = () => (typeof window !== "undefined" ? window.localStorage : null);

const getLocalInstalledPackages = (): string[] => {
  try {
    const storage = safeLocalStorage();
    if (!storage) return [];
    const raw = storage.getItem(LOCAL_INSTALLED_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setLocalInstalledPackages = (ids: string[]): void => {
  try {
    const storage = safeLocalStorage();
    if (!storage) return;
    storage.setItem(LOCAL_INSTALLED_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
};

const getDefaultUpdateSource = (): "store" | "website" =>
  getDistributionChannel() === "store" ? "store" : "website";

class DLCManager {
  private storeState: DLCStoreState = {
    packages: dlcRegistry.getAllPackages(),
    ownedPackages: [],
    installedPackages: [],
    licenses: [],
    installations: [],
  };
  private packageUuidById = new Map<string, string>();
  private packageIdByUuid = new Map<string, string>();

  async initialize(): Promise<void> {
    await this.refreshPackages();
    await this.refreshLicenses();
    await this.refreshInstallations();
  }

  getStoreState(): DLCStoreState {
    return this.storeState;
  }

  private mapPackageRow(row: Record<string, unknown>, index: number): DLCPackage {
    const packageId = String(row.package_id || row.packageId || row.id || "");
    const fallback = dlcRegistry.getPackage(packageId);
    const packType = String(row.pack_type || row.packType || "content");
    const packageType =
      packType === "bundle" || packType === "subscription" ? packType : "individual";
    const price = Number(row.price ?? row.price_usd ?? 0);
    const priceType = packageType === "subscription" ? "subscription" : price <= 0 ? "free" : "one-time";

    const contentItems = Array.isArray(row.content_items) ? (row.content_items as any[]) : [];
    const downloadUrl =
      contentItems.find(item => item?.download_url)?.download_url ||
      contentItems.find(item => item?.downloadUrl)?.downloadUrl ||
      null;

    return {
      packageId,
      packageName: String(row.name || row.package_name || fallback?.packageName || packageId),
      safeDescription: String(
        row.safe_description || row.description || fallback?.safeDescription || "",
      ),
      fullDescription: row.full_description
        ? String(row.full_description)
        : fallback?.fullDescription,
      contentRating: row.content_rating
        ? String(row.content_rating)
        : fallback?.contentRating,
      version: String(row.version || fallback?.version || "1.0.0"),
      priceUsd: Number.isFinite(price) ? price : fallback?.priceUsd || 0,
      currency: String(row.currency || fallback?.currency || "USD"),
      priceType,
      packageType,
      isActive: row.is_active !== false,
      isFeatured: Boolean(row.is_featured || fallback?.isFeatured),
      displayOrder: Number(row.display_order || index),
      requiresBasePack: Boolean(row.requires_base_pack || fallback?.requiresBasePack),
      basePackId: row.base_pack_id ? String(row.base_pack_id) : fallback?.basePackId || null,
      previewImages: (row.preview_images as string[]) || fallback?.previewImages || [],
      previewVideoUrl: row.preview_video_url
        ? String(row.preview_video_url)
        : fallback?.previewVideoUrl || null,
      tags: (row.tags as string[]) || fallback?.tags || [],
      stripeProductId: row.stripe_product_id ? String(row.stripe_product_id) : null,
      stripePriceId: row.stripe_price_id ? String(row.stripe_price_id) : null,
      regionalPricing: fallback?.regionalPricing,
      includedPackages: fallback?.includedPackages,
      features:
        (row.features as DLCPackage["features"]) ||
        (row.feature_list as DLCPackage["features"]) ||
        fallback?.features ||
        [],
      downloadUrl: downloadUrl ? String(downloadUrl) : fallback?.downloadUrl || null,
      checksum: row.checksum ? String(row.checksum) : fallback?.checksum || null,
      downloadSizeBytes: row.size_bytes ? Number(row.size_bytes) : null,
      releaseDate: row.release_date ? String(row.release_date) : null,
    };
  }

  private async refreshPackages(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("dlc_packages")
        .select("*")
        .eq("is_active", true)
        .limit(500);

      if (error || !data || data.length === 0) {
        this.storeState = {
          ...this.storeState,
          packages: dlcRegistry.getAllPackages(),
        };
        return;
      }

      const packages = (data || []).map((row, idx) =>
        this.mapPackageRow(row as Record<string, unknown>, idx),
      );

      this.packageUuidById.clear();
      this.packageIdByUuid.clear();
      data.forEach(row => {
        const pid = String((row as any).package_id || "");
        const uuid = String((row as any).id || "");
        if (pid && uuid) {
          this.packageUuidById.set(pid, uuid);
          this.packageIdByUuid.set(uuid, pid);
        }
      });

      this.storeState = {
        ...this.storeState,
        packages,
      };
    } catch (error) {
      logger.warn("DLCManager: Package refresh failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      this.storeState = {
        ...this.storeState,
        packages: dlcRegistry.getAllPackages(),
      };
    }
  }

  private async refreshLicenses(): Promise<void> {
    const licenses = await licenseValidator.getLicenses();
    const owned = new Set<string>();

    licenses.forEach(license => {
      if (license.packageId) owned.add(license.packageId);
    });

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (userId) {
        const { data: purchases } = await supabase
          .from("dlc_purchases")
          .select("package_id, pack_id")
          .eq("user_id", userId)
          .limit(500);
        (purchases || []).forEach((row: any) => {
          const id = row.package_id ? String(row.package_id) : row.pack_id ? String(row.pack_id) : "";
          if (id) owned.add(id);
        });
      }
    } catch {
      // ignore
    }

    this.storeState = {
      ...this.storeState,
      licenses,
      ownedPackages: Array.from(owned),
    };
  }

  private async refreshInstallations(): Promise<void> {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        const local = getLocalInstalledPackages();
        this.storeState = {
          ...this.storeState,
          installations: [],
          installedPackages: local,
        };
        return;
      }

      const { data, error } = await supabase
        .from("dlc_installations")
        .select("package_id, installed_version, installed_at, file_size_bytes, checksum, is_valid")
        .eq("user_id", auth.user.id)
        .limit(500);

      if (error || !data) {
        const local = getLocalInstalledPackages();
        this.storeState = {
          ...this.storeState,
          installations: [],
          installedPackages: local,
        };
        return;
      }

      const installations: DLCInstallation[] = (data || []).map((row: any) => {
        const uuid = String(row.package_id || "");
        const packageId = this.packageIdByUuid.get(uuid) || uuid;
        return {
          packageId,
          installedVersion: String(row.installed_version || "1.0.0"),
          installedAt: row.installed_at ? String(row.installed_at) : null,
          fileSizeBytes: row.file_size_bytes ? Number(row.file_size_bytes) : null,
          checksum: row.checksum ? String(row.checksum) : null,
          isValid: row.is_valid ?? true,
        };
      });

      const installedPackages = installations.map(i => i.packageId);
      setLocalInstalledPackages(installedPackages);
      this.storeState = {
        ...this.storeState,
        installations,
        installedPackages,
      };
    } catch (error) {
      logger.warn("DLCManager: Installation refresh failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  ownsPackage(packageId: string): boolean {
    return this.storeState.ownedPackages.includes(packageId);
  }

  isPackageInstalled(packageId: string): boolean {
    return this.storeState.installedPackages.includes(packageId);
  }

  hasFeature(featureId: string): boolean {
    const byId = new Map(this.storeState.packages.map(p => [p.packageId, p] as const));
    return this.storeState.ownedPackages.some(packageId => {
      const pkg = byId.get(packageId);
      return pkg?.features.some(f => f.id === featureId);
    });
  }

  getLicense(packageId: string): DLCLicense | undefined {
    return this.storeState.licenses.find(l => l.packageId === packageId);
  }

  async validateLicense(packageId: string): Promise<LicenseValidationResult> {
    return licenseValidator.validateExistingLicense(packageId);
  }

  async activateLicense(
    licenseKey: string,
  ): Promise<{ success: boolean; packageId?: string; error?: string }> {
    const result = await licenseValidator.activateLicense(licenseKey);
    if (result.success) {
      await this.refreshLicenses();
    }
    return {
      success: result.success,
      packageId: result.packageId,
      error: result.error,
    };
  }

  getInstallation(packageId: string): DLCInstallation | undefined {
    return this.storeState.installations.find(i => i.packageId === packageId);
  }

  async installPackage(
    packageId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.ownsPackage(packageId)) {
      return { success: false, error: "Package not owned" };
    }

    await downloadManager.queueDownload(packageId, 0);

    const installed = new Set(this.storeState.installedPackages);
    installed.add(packageId);
    setLocalInstalledPackages(Array.from(installed));
    this.storeState = {
      ...this.storeState,
      installedPackages: Array.from(installed),
    };

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const pkgUuid = this.packageUuidById.get(packageId);
        if (pkgUuid) {
          await supabase.from("dlc_installations").upsert(
            {
              user_id: auth.user.id,
              package_id: pkgUuid,
              installed_version: this.getPackage(packageId)?.version || "1.0.0",
              installed_at: new Date().toISOString(),
              is_valid: true,
            },
            { onConflict: "user_id,package_id" },
          );
        }
      }
    } catch (error) {
      logger.warn("DLCManager: Installation upsert failed", {
        packageId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return { success: true };
  }

  async uninstallPackage(
    packageId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const installed = new Set(this.storeState.installedPackages);
    installed.delete(packageId);
    setLocalInstalledPackages(Array.from(installed));
    this.storeState = {
      ...this.storeState,
      installedPackages: Array.from(installed),
    };
    await downloadManager.deleteCachedContent(packageId);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const pkgUuid = this.packageUuidById.get(packageId);
        if (pkgUuid) {
          await supabase
            .from("dlc_installations")
            .delete()
            .eq("user_id", auth.user.id)
            .eq("package_id", pkgUuid);
        }
      }
    } catch (error) {
      logger.warn("DLCManager: Installation delete failed", {
        packageId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return { success: true };
  }

  getDownloadProgress(packageId: string) {
    return downloadManager.getProgress(packageId);
  }

  getActiveDownloads() {
    return downloadManager.getActiveDownloads();
  }

  async checkForUpdates(): Promise<DLCUpdate[]> {
    const owned = new Set(this.storeState.ownedPackages);
    const updates = await getDLCUpdates();
    return updates
      .filter(u => owned.has(u.pack_id))
      .map(u => ({
        packageId: u.pack_id,
        version: u.version_number,
        updateType: u.update_type,
        changelog: u.changelog,
        isRequired: u.is_required,
        releaseDate: u.release_date,
        downloadUrl: u.update_file_url,
        sizeBytes: u.update_file_size_bytes ?? null,
      }));
  }

  async verifyAge(age: number, consent: boolean): Promise<boolean> {
    if (!consent || age < 18) return false;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return false;

    try {
      await supabase.from("dlc_age_verifications").upsert(
        {
          user_id: auth.user.id,
          verification_method: "self_attested",
          verified_at: new Date().toISOString(),
          is_verified: true,
          metadata: { age, consent: true },
        },
        { onConflict: "user_id" },
      );
      return true;
    } catch (error) {
      logger.warn("DLCManager: Age verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  async isAgeVerified(): Promise<boolean> {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data, error } = await supabase
        .from("dlc_age_verifications")
        .select("is_verified, expires_at")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (error || !data) return false;
      if (data.expires_at && new Date(data.expires_at) < new Date()) return false;
      return Boolean(data.is_verified);
    } catch {
      return false;
    }
  }

  getUpdateSource(): "store" | "website" {
    const storage = safeLocalStorage();
    const stored = storage?.getItem(UPDATE_SOURCE_KEY) as "store" | "website" | null;
    return stored || getDefaultUpdateSource();
  }

  isUpdateSourceAcknowledged(): boolean {
    const storage = safeLocalStorage();
    return storage?.getItem(UPDATE_SOURCE_ACK_KEY) === "true";
  }

  acknowledgeUpdateSourceChange(): void {
    const storage = safeLocalStorage();
    if (!storage) return;
    storage.setItem(UPDATE_SOURCE_ACK_KEY, "true");
    storage.setItem(UPDATE_SOURCE_KEY, getDefaultUpdateSource());
  }

  calculateUpgradePrice(targetPackageId: string): number {
    const target = this.getPackage(targetPackageId);
    if (!target) return 0;
    if (!target.includedPackages || target.includedPackages.length === 0) return target.priceUsd;

    const owned = new Set(this.storeState.ownedPackages);
    const discount = target.includedPackages.reduce((sum, id) => {
      if (!owned.has(id)) return sum;
      const pkg = this.getPackage(id);
      return sum + (pkg?.priceUsd || 0);
    }, 0);
    return Math.max(0, target.priceUsd - discount);
  }

  getPackage(packageId: string): DLCPackage | undefined {
    return this.storeState.packages.find(p => p.packageId === packageId) || dlcRegistry.getPackage(packageId);
  }
}

export const dlcManager = new DLCManager();
export type { DLCManager };
