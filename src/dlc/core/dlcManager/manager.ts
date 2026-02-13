import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { dlcRegistry } from "../DLCRegistry";
import { getDeviceId, getDevicePlatform } from "../device";
import type {
  DLCPackage,
  DLCLicense,
  DLCInstallation,
  DLCStoreState,
  DownloadProgress,
  DLCUpdate,
  LicenseValidationResult,
  AppUpdateSource,
} from "../types";
import { dlcCache } from "./cache";
import {
  acknowledgeUpdateSource,
  deleteInstallation,
  fetchAgeVerificationFromDb,
  fetchInstallationsFromDb,
  fetchLicensesFromDb,
  fetchPackagesFromDb,
  fetchUpdateSourceFromDb,
  upsertAgeVerification,
  upsertInstallation,
} from "./db";
import { licenseValidator } from "../licenseValidator";
import { downloadManager } from "../downloadManager";
import { getInstalledContentVersion } from "@/lib/contentPackage";

function semverCompare(a: string, b: string): number {
  const pa = String(a || "").split(".").map(n => Number(n));
  const pb = String(b || "").split(".").map(n => Number(n));
  for (let i = 0; i < 3; i++) {
    const av = Number.isFinite(pa[i]) ? pa[i] : 0;
    const bv = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class DLCManager {
  private packagesByPackageId: Map<string, DLCPackage> = new Map();
  private packagesByDbId: Map<string, DLCPackage> = new Map();
  private licensesByPackageId: Map<string, DLCLicense> = new Map();
  private installationsByPackageId: Map<string, DLCInstallation> = new Map();

  private updateSource: AppUpdateSource | null = null;

  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // 1) Registry packages are always available (static catalog metadata).
      for (const pkg of dlcRegistry.getAllPackages()) {
        this.packagesByPackageId.set(pkg.packageId, pkg);
      }

      // 2) Cache warm start (never treated as authoritative for entitlements).
      try {
        const cachedPackages = dlcCache.loadPackages();
        cachedPackages.forEach(p => this.stagePackage(p));
      } catch {
        // ignore
      }

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      if (userId) {
        try {
          dlcCache.loadLicenses(userId).forEach(l => this.licensesByPackageId.set(l.packageId, l));
          dlcCache
            .loadInstallations(userId)
            .forEach(i => this.installationsByPackageId.set(i.packageId, i));
          this.updateSource = dlcCache.loadUpdateSource(userId);
        } catch {
          // ignore
        }
      }

      // 3) DB refresh (authoritative source of truth)
      await this.refreshFromDb();

      // Keep in sync for login/logout without requiring full reload.
      supabase.auth.onAuthStateChange((_event, session) => {
        const nextUserId = session?.user?.id ?? null;
        void this.onUserChanged(nextUserId);
      });

      this.initialized = true;
    })();

    return this.initPromise;
  }

  private stagePackage(pkg: DLCPackage): void {
    if (!pkg?.packageId) return;
    this.packagesByPackageId.set(pkg.packageId, pkg);
    if (pkg.id) this.packagesByDbId.set(pkg.id, pkg);
  }

  private async onUserChanged(userId: string | null): Promise<void> {
    this.licensesByPackageId.clear();
    this.installationsByPackageId.clear();
    this.updateSource = null;

    if (!userId) return;

    // Fast warm start for new session
    try {
      dlcCache.loadLicenses(userId).forEach(l => this.licensesByPackageId.set(l.packageId, l));
      dlcCache
        .loadInstallations(userId)
        .forEach(i => this.installationsByPackageId.set(i.packageId, i));
      this.updateSource = dlcCache.loadUpdateSource(userId);
    } catch {
      // ignore
    }

    await this.refreshFromDb();
  }

  private async refreshFromDb(): Promise<void> {
    // Packages are public (no auth required).
    const dbPackages = await fetchPackagesFromDb();
    dbPackages.forEach(p => this.stagePackage(p));
    dlcCache.savePackages(this.getAvailablePackages());

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    if (!userId) return;

    const [licenses, installations, updateSource] = await Promise.all([
      fetchLicensesFromDb(userId),
      fetchInstallationsFromDb(userId),
      fetchUpdateSourceFromDb({ userId, deviceId: getDeviceId() }),
    ]);

    this.licensesByPackageId.clear();
    licenses.forEach(l => this.licensesByPackageId.set(l.packageId, l));

    this.installationsByPackageId.clear();
    installations.forEach(i => this.installationsByPackageId.set(i.packageId, i));

    this.updateSource = updateSource;

    dlcCache.saveLicenses(userId, licenses);
    dlcCache.saveInstallations(userId, installations);
    if (updateSource) dlcCache.saveUpdateSource(userId, updateSource);
  }

  // ==========================================
  // Package Catalog
  // ==========================================
  getAvailablePackages(): DLCPackage[] {
    return Array.from(this.packagesByPackageId.values())
      .filter(p => p.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getPackage(packageId: string): DLCPackage | undefined {
    return this.packagesByPackageId.get(String(packageId || "").trim());
  }

  getFeaturedPackages(): DLCPackage[] {
    return this.getAvailablePackages().filter(p => p.isFeatured);
  }

  getOwnedPackages(): DLCPackage[] {
    const ids = this.getOwnedPackageIdsExpanded();
    return Array.from(ids)
      .map(id => this.getPackage(id))
      .filter((p): p is DLCPackage => Boolean(p));
  }

  getInstalledPackages(): DLCPackage[] {
    const ids = this.getInstalledPackageIdsExpanded();
    return Array.from(ids)
      .map(id => this.getPackage(id))
      .filter((p): p is DLCPackage => Boolean(p));
  }

  // ==========================================
  // Entitlements / features
  // ==========================================
  private getOwnedPackageIdsExpanded(): Set<string> {
    const out = new Set<string>();
    for (const pId of this.licensesByPackageId.keys()) {
      out.add(pId);
      const pkg = this.getPackage(pId);
      (pkg?.includedPackages || []).forEach(child => out.add(child));
    }
    return out;
  }

  private getInstalledPackageIdsExpanded(): Set<string> {
    const out = new Set<string>();
    for (const pId of this.installationsByPackageId.keys()) {
      out.add(pId);
      const pkg = this.getPackage(pId);
      (pkg?.includedPackages || []).forEach(child => out.add(child));
    }
    return out;
  }

  ownsPackage(packageId: string): boolean {
    return this.getOwnedPackageIdsExpanded().has(String(packageId || "").trim());
  }

  isPackageInstalled(packageId: string): boolean {
    return this.getInstalledPackageIdsExpanded().has(String(packageId || "").trim());
  }

  hasFeature(featureId: string): boolean {
    const fId = String(featureId || "").trim();
    if (!fId) return false;

    // UI gating: ownership OR installation (bundles expand to included packages)
    const packageIds = new Set<string>([
      ...this.getOwnedPackageIdsExpanded().values(),
      ...this.getInstalledPackageIdsExpanded().values(),
    ]);

    for (const packageId of packageIds) {
      const pkg = this.getPackage(packageId);
      if (!pkg) continue;
      if (pkg.features.some(f => f.id === fId)) return true;
    }
    return false;
  }

  // ==========================================
  // Licenses
  // ==========================================
  getLicense(packageId: string): DLCLicense | undefined {
    const id = String(packageId || "").trim();
    const direct = this.licensesByPackageId.get(id);
    if (direct) return direct;

    // Bundle-owned package: return parent license if it includes the requested package.
    for (const lic of this.licensesByPackageId.values()) {
      const pkg = this.getPackage(lic.packageId);
      if (pkg?.includedPackages?.includes(id)) return lic;
    }
    return undefined;
  }

  async validateLicense(packageId: string): Promise<LicenseValidationResult> {
    const lic = this.getLicense(packageId);
    if (!lic) return { isValid: false, error: "license_not_found", deviceAuthorized: false };

    const local = licenseValidator.validateLocal(lic);
    if (!local.isValid) return local;

    // Best-effort device binding check (server-side enforcement remains authoritative).
    // If the query fails due to schema/policy differences, fail open for UI gating.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("dlc_license_devices")
        .select("device_id,is_active")
        .eq("license_id", lic.id)
        .eq("is_active", true);

      if (!error && Array.isArray(data)) {
        const deviceId = getDeviceId();
        const bound = data.some((d: any) => String(d.device_id) === deviceId);
        // If there are bindings and we're not in them, mark unauthorized.
        if (data.length > 0 && !bound) {
          return { ...local, isValid: false, error: "device_not_authorized", deviceAuthorized: false };
        }
      }
    } catch {
      // ignore
    }

    return local;
  }

  async activateLicense(
    licenseKey: string,
  ): Promise<{ success: boolean; packageId?: string; error?: string }> {
    const key = String(licenseKey || "").trim().toUpperCase();
    if (!key) return { success: false, error: "License key required" };

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { success: false, error: "Please sign in to activate a license" };

    const deviceId = getDeviceId();
    const devicePlatform = getDevicePlatform();

    const { data, error } = await supabase.functions.invoke("verify-dlc-license", {
      body: { licenseKey: key, userId: auth.user.id, deviceId, devicePlatform },
    });

    if (error) return { success: false, error: error.message };
    if (!data?.valid) return { success: false, error: "License verification failed" };

    await this.refreshFromDb();

    const packageId = String(data?.license?.packageId || "").trim();
    return { success: true, packageId: packageId || undefined };
  }

  // ==========================================
  // Installations
  // ==========================================
  getInstallation(packageId: string): DLCInstallation | undefined {
    return this.installationsByPackageId.get(String(packageId || "").trim());
  }

  async installPackage(packageId: string): Promise<{ success: boolean; error?: string }> {
    const id = String(packageId || "").trim();
    if (!id) return { success: false, error: "Package not specified" };

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    if (!userId) return { success: false, error: "Please sign in" };

    const lic = this.getLicense(id);
    if (!lic) return { success: false, error: "License required" };

    const validation = await this.validateLicense(id);
    if (!validation.isValid) return { success: false, error: validation.error || "Invalid license" };

    const pkg = this.getPackage(id);
    if (!pkg) return { success: false, error: "Package not found" };

    // Optional: download content package if distribution is defined.
    // If no downloadable distribution exists, installation is still recorded for entitlement flows.
    try {
      await downloadManager.queueDownload(id, 0);
      const p = downloadManager.getProgress(id);
      if (p?.status === "failed" && p.error && !p.error.toLowerCase().includes("no downloadable")) {
        return { success: false, error: p.error };
      }
    } catch {
      // ignore download errors; install may still be metadata-only
    }

    const packageIdsToInstall = new Set<string>([id, ...(pkg.includedPackages || [])]);
    const results: DLCInstallation[] = [];

    for (const pid of packageIdsToInstall) {
      const p = this.getPackage(pid) ?? pkg;
      const row = await upsertInstallation({
        userId,
        packageId: pid,
        licenseId: lic.id,
        installedVersion: p.version || "1.0.0",
        contentVersion: p.contentVersion,
        installSource: "manual",
      });
      if (row) results.push(row);
    }

    // Update local state
    results.forEach(i => this.installationsByPackageId.set(i.packageId, i));
    dlcCache.saveInstallations(userId, Array.from(this.installationsByPackageId.values()));

    return { success: true };
  }

  async uninstallPackage(packageId: string): Promise<{ success: boolean; error?: string }> {
    const id = String(packageId || "").trim();
    if (!id) return { success: false, error: "Package not specified" };

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    if (!userId) return { success: false, error: "Please sign in" };

    const pkg = this.getPackage(id);
    const packageIdsToRemove = new Set<string>([id, ...((pkg?.includedPackages || []) as string[])]);

    for (const pid of packageIdsToRemove) {
      await deleteInstallation({ userId, packageId: pid });
      this.installationsByPackageId.delete(pid);
      void downloadManager.deleteCachedContent(pid);
    }

    dlcCache.saveInstallations(userId, Array.from(this.installationsByPackageId.values()));
    return { success: true };
  }

  // ==========================================
  // Downloads
  // ==========================================
  getDownloadProgress(packageId: string): DownloadProgress | undefined {
    return downloadManager.getProgress(String(packageId || "").trim());
  }

  getActiveDownloads(): DownloadProgress[] {
    return downloadManager.getActiveDownloads();
  }

  // ==========================================
  // Updates
  // ==========================================
  async checkForUpdates(): Promise<DLCUpdate[]> {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    if (!userId) return [];

    const installed = Array.from(this.getInstalledPackageIdsExpanded().values());
    if (installed.length === 0) return [];

    const tasks = installed.slice(0, 25).map(async pid => {
      const currentVersion = getInstalledContentVersion(pid);
      const { data, error } = await supabase.functions.invoke("check-dlc-updates", {
        body: { currentVersion, userId, packageId: pid },
      });
      if (error || !data?.hasUpdate || !data?.package?.version) return null;

      const latest = String(data.package.version);
      const current = String(currentVersion || "0.0.0");
      const cmp = semverCompare(latest, current);
      if (cmp === 0) return null;

      const updateType: DLCUpdate["updateType"] =
        latest.split(".")[0] !== current.split(".")[0]
          ? "major"
          : latest.split(".")[1] !== current.split(".")[1]
            ? "minor"
            : "patch";

      return {
        packageId: pid,
        currentVersion: current,
        latestVersion: latest,
        updateType,
        updatePolicy: "notify",
        changelog: Array.isArray(data.package.changelog) ? data.package.changelog : [],
        downloadSizeBytes: Number(data.package.size || 0) || 0,
        isRequired: false,
        releaseDate: data.package.releaseDate ? new Date(String(data.package.releaseDate)) : undefined,
      } satisfies DLCUpdate;
    });

    const settled = await Promise.allSettled(tasks);
    const updates = settled
      .map(r => (r.status === "fulfilled" ? r.value : null))
      .filter((x): x is DLCUpdate => Boolean(x));

    return updates;
  }

  // ==========================================
  // Age verification
  // ==========================================
  async isAgeVerified(): Promise<boolean> {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    if (!userId) return false;

    const age = await fetchAgeVerificationFromDb(userId);
    if (!age) {
      const cached = dlcCache.loadAgeVerification(userId);
      return Boolean(cached?.adultContentConsent && cached?.termsAccepted);
    }
    dlcCache.saveAgeVerification(userId, age);
    return Boolean(age.adultContentConsent && age.termsAccepted);
  }

  async verifyAge(declaredAge: number, consent: boolean): Promise<boolean> {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    if (!userId) return false;

    const ok = await upsertAgeVerification({ userId, declaredAge, consent, termsVersion: "1.0" });
    if (!ok) return false;

    // Refresh cached record
    const age = await fetchAgeVerificationFromDb(userId);
    if (age) dlcCache.saveAgeVerification(userId, age);
    return true;
  }

  // ==========================================
  // Update source
  // ==========================================
  getUpdateSource(): "store" | "website" {
    // If any DLC is installed, updates must come from website (direct distribution).
    if (this.installationsByPackageId.size > 0) return "website";
    return this.updateSource?.currentUpdateSource ?? "store";
  }

  isUpdateSourceAcknowledged(): boolean {
    return Boolean(this.updateSource?.updateSourceAcknowledged);
  }

  acknowledgeUpdateSourceChange(): void {
    const deviceId = getDeviceId();
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        const userId = data.user?.id ?? null;
        if (!userId) return;
        void acknowledgeUpdateSource({ userId, deviceId });
        this.updateSource = {
          userId,
          deviceId,
          currentUpdateSource: "website",
          sourceChangedAt: new Date(),
          sourceChangeReason: "dlc_installed",
          updateSourceAcknowledged: true,
          acknowledgedAt: new Date(),
        };
        dlcCache.saveUpdateSource(userId, this.updateSource);
      })
      .catch(() => {});
  }

  // ==========================================
  // Pricing
  // ==========================================
  calculateUpgradePrice(targetPackageId: string): number {
    const owned = Array.from(this.getOwnedPackageIdsExpanded().values());
    return dlcRegistry.calculateUpgradePrice(targetPackageId, owned);
  }

  // ==========================================
  // Store state
  // ==========================================
  getStoreState(): DLCStoreState {
    const downloads: Record<string, DownloadProgress> = {};
    for (const p of downloadManager.getAll()) {
      downloads[p.packageId] = p;
    }

    return {
      packages: this.getAvailablePackages(),
      ownedPackages: Array.from(this.getOwnedPackageIdsExpanded().values()),
      installedPackages: Array.from(this.getInstalledPackageIdsExpanded().values()),
      downloads,
      isLoading: false,
      error: null,
    };
  }
}

export const dlcManager = new DLCManager();

