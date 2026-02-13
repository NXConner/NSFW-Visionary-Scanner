import { dlcRegistry, type DLCRegistry } from "../DLCRegistry";
import { getDeviceId, getDevicePlatform } from "../device";
import type {
  DLCPackage,
  DLCLicense,
  DLCInstallation,
  DownloadProgress,
  LicenseValidationResult,
  DLCUpdate,
  DevicePlatform,
} from "../types";
import { clearPackageCache } from "./indexedDbCache";
import { isAgeVerified as isAgeVerifiedFn, verifyAge as verifyAgeFn } from "./ageVerification";
import {
  activateLicense as activateLicenseFn,
  loadLicenses,
  validateLicenseLocally,
} from "./licenses";
import { getAvailablePackages, getFeaturedPackages, getPackage, loadPackages } from "./packages";
import { installPackageLocal, loadInstallations, uninstallPackageLocal } from "./installations";
import { checkForUpdates as checkForUpdatesFn } from "./updates";
import {
  acknowledgeUpdateSourceChange as acknowledgeUpdateSourceChangeFn,
  getUpdateSource as getUpdateSourceFn,
  isUpdateSourceAcknowledged as isUpdateSourceAcknowledgedFn,
} from "./updateSource";
import { getStoreState as getStoreStateFn } from "./storeState";

export class DLCManager {
  private registry: DLCRegistry;
  private deviceId: string;
  private platform: DevicePlatform;

  private packages: Map<string, DLCPackage> = new Map();
  private licenses: Map<string, DLCLicense> = new Map();
  private installations: Map<string, DLCInstallation> = new Map();
  private downloads: Map<string, DownloadProgress> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.registry = dlcRegistry;
    // Wrap in try-catch to prevent crashes in restricted contexts
    try {
      this.deviceId = getDeviceId();
      this.platform = getDevicePlatform();
    } catch {
      this.deviceId = `web-fallback-${Date.now()}`;
      this.platform = 'web';
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await Promise.all([
        loadPackages(this.registry, this.packages),
        loadLicenses(this.licenses),
        loadInstallations(this.installations, this.deviceId),
      ]);
    } catch (error) {
      // Log but don't throw - allow app to continue with empty state
    }
    this.initialized = true;
  }

  // =========================
  // Package access
  // =========================

  getAvailablePackages(): DLCPackage[] {
    return getAvailablePackages(this.registry, this.packages);
  }

  getPackage(packageId: string): DLCPackage | undefined {
    return getPackage(this.registry, this.packages, packageId);
  }

  getFeaturedPackages(): DLCPackage[] {
    return getFeaturedPackages(this.registry, this.packages);
  }

  getOwnedPackages(): DLCPackage[] {
    const ownedIds = Array.from(this.licenses.keys());
    return ownedIds.map(id => this.getPackage(id)).filter((pkg): pkg is DLCPackage => Boolean(pkg));
  }

  getInstalledPackages(): DLCPackage[] {
    const installedIds = Array.from(this.installations.keys());
    return installedIds
      .map(id => this.getPackage(id))
      .filter((pkg): pkg is DLCPackage => Boolean(pkg));
  }

  ownsPackage(packageId: string): boolean {
    return this.licenses.has(packageId);
  }

  isPackageInstalled(packageId: string): boolean {
    return this.installations.has(packageId);
  }

  hasFeature(featureId: string): boolean {
    const installedIds = Array.from(this.installations.keys());
    const ownedIds = Array.from(this.licenses.keys());
    for (const packageId of [...new Set([...installedIds, ...ownedIds])]) {
      const pkg = this.getPackage(packageId);
      if (!pkg) continue;
      const featureList =
        pkg.features && pkg.features.length > 0
          ? pkg.features
          : this.registry.getAllFeaturesForPackage(packageId);
      if (featureList.some(f => f.id === featureId)) return true;
    }
    return false;
  }

  calculateUpgradePrice(targetPackageId: string): number {
    return this.registry.calculateUpgradePrice(targetPackageId, Array.from(this.licenses.keys()));
  }

  // =========================
  // Licenses
  // =========================

  getLicense(packageId: string): DLCLicense | undefined {
    return this.licenses.get(packageId);
  }

  async validateLicense(packageId: string): Promise<LicenseValidationResult> {
    const license = this.licenses.get(packageId);
    if (!license) return { isValid: false, error: "license_not_found", deviceAuthorized: false };
    return validateLicenseLocally(license);
  }

  async activateLicense(
    licenseKey: string,
  ): Promise<{ success: boolean; packageId?: string; error?: string }> {
    return await activateLicenseFn(this.deviceId, licenseKey, this.licenses);
  }

  // =========================
  // Installations
  // =========================

  getInstallation(packageId: string): DLCInstallation | undefined {
    return this.installations.get(packageId);
  }

  async installPackage(packageId: string): Promise<{ success: boolean; error?: string }> {
    return await installPackageLocal({
      registry: this.registry,
      packageId,
      deviceId: this.deviceId,
      platform: this.platform,
      licenses: this.licenses,
      installations: this.installations,
      ownsPackage: id => this.ownsPackage(id),
      validateLicense: id => this.validateLicense(id),
      getPackage: id => this.getPackage(id),
    });
  }

  async uninstallPackage(packageId: string): Promise<{ success: boolean; error?: string }> {
    return await uninstallPackageLocal({
      packageId,
      deviceId: this.deviceId,
      installations: this.installations,
      clearPackageCache,
    });
  }

  // =========================
  // Downloads
  // =========================

  getDownloadProgress(packageId: string): DownloadProgress | undefined {
    return this.downloads.get(packageId);
  }

  getActiveDownloads(): DownloadProgress[] {
    return Array.from(this.downloads.values()).filter(
      d => d.status === "downloading" || d.status === "pending",
    );
  }

  // =========================
  // Updates
  // =========================

  async checkForUpdates(): Promise<DLCUpdate[]> {
    return await checkForUpdatesFn(this.registry, this.installations);
  }

  // =========================
  // Age verification
  // =========================

  async isAgeVerified(): Promise<boolean> {
    return await isAgeVerifiedFn();
  }

  async verifyAge(declaredAge: number, consent: boolean): Promise<boolean> {
    return await verifyAgeFn(declaredAge, consent);
  }

  // =========================
  // Update source
  // =========================

  getUpdateSource(): "store" | "website" {
    return getUpdateSourceFn(this.installations.size);
  }

  isUpdateSourceAcknowledged(): boolean {
    return isUpdateSourceAcknowledgedFn();
  }

  acknowledgeUpdateSourceChange(): void {
    acknowledgeUpdateSourceChangeFn(this.deviceId);
  }

  // =========================
  // Store state
  // =========================

  getStoreState(): ReturnType<typeof getStoreStateFn> {
    return getStoreStateFn({
      packages: this.getAvailablePackages(),
      ownedPackageIds: Array.from(this.licenses.keys()),
      installedPackageIds: Array.from(this.installations.keys()),
      downloads: this.downloads,
    });
  }
}

export const dlcManager = new DLCManager();
