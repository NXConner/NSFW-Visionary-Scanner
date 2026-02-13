import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { DownloadProgress } from "../types";
import { secureDownloader } from "@/dlc/security";
import {
  extractAndInstallPackageBytes,
  getInstalledManifest,
  isContentInstalled,
} from "@/lib/contentPackage";
import { deletePackageFiles, getPackageBytesUsed } from "./contentDb";

type Listener = (downloads: DownloadProgress[]) => void;

type ResolvedPackageDistribution = {
  downloadUrl: string;
  checksum: string;
  sizeBytes?: number;
};

function normalizeChecksumHex(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^sha256:/, "");
}

async function resolveDistribution(packageId: string): Promise<ResolvedPackageDistribution | null> {
  // Prefer db-backed per-package distribution fields if present.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("dlc_packages")
      .select("download_url, checksum_sha256, download_size_bytes")
      .eq("package_id", packageId)
      .maybeSingle();

    if (!error && data?.download_url && data?.checksum_sha256) {
      return {
        downloadUrl: String(data.download_url),
        checksum: String(data.checksum_sha256),
        sizeBytes: data.download_size_bytes ? Number(data.download_size_bytes) : undefined,
      };
    }
  } catch {
    // ignore and fall back to edge function
  }

  // Fall back to edge function (global DLC content packages)
  try {
    const { data, error } = await supabase.functions.invoke("get-dlc-content", {
      body: { packageId },
    });
    if (error) {
      logger.warn("[dlc] get-dlc-content failed", { packageId, error: error.message });
      return null;
    }
    if (!data?.package?.downloadUrl || !data?.package?.checksum) return null;
    return {
      downloadUrl: String(data.package.downloadUrl),
      checksum: String(data.package.checksum),
      sizeBytes: data.package.size ? Number(data.package.size) : undefined,
    };
  } catch (err) {
    logger.warn("[dlc] resolveDistribution failed", { packageId, error: err });
    return null;
  }
}

function initProgress(packageId: string): DownloadProgress {
  return {
    packageId,
    status: "pending",
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    speedBps: 0,
    estimatedTimeRemaining: 0,
  };
}

export class DownloadManager {
  private listeners: Set<Listener> = new Set();
  private progressByPackageId: Map<string, DownloadProgress> = new Map();
  private controllers: Map<string, AbortController> = new Map();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // immediate emit
    listener(this.getAll());
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snapshot = this.getAll();
    this.listeners.forEach(l => {
      try {
        l(snapshot);
      } catch {
        // ignore listener errors
      }
    });
  }

  private upsert(packageId: string, updates: Partial<DownloadProgress>): DownloadProgress {
    const current = this.progressByPackageId.get(packageId) ?? initProgress(packageId);
    const next: DownloadProgress = { ...current, ...updates };
    this.progressByPackageId.set(packageId, next);
    this.emit();
    return next;
  }

  private requireNotActive(packageId: string): boolean {
    const current = this.progressByPackageId.get(packageId);
    return !current || (current.status !== "downloading" && current.status !== "pending");
  }

  getAll(): DownloadProgress[] {
    return Array.from(this.progressByPackageId.values());
  }

  getActiveDownloads(): DownloadProgress[] {
    return this.getAll().filter(p => p.status === "pending" || p.status === "downloading");
  }

  getProgress(packageId: string): DownloadProgress | undefined {
    return this.progressByPackageId.get(packageId);
  }

  async queueDownload(packageId: string, _priority: number = 0): Promise<void> {
    const id = String(packageId || "").trim();
    if (!id) return;
    if (!this.requireNotActive(id)) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      this.upsert(id, { status: "failed", error: "Please sign in to download DLC content" });
      return;
    }

    const resolved = await resolveDistribution(id);
    if (!resolved) {
      this.upsert(id, { status: "failed", error: "No downloadable content available for this package" });
      return;
    }

    const controller = new AbortController();
    this.controllers.set(id, controller);

    const expectedChecksum = normalizeChecksumHex(resolved.checksum);

    try {
      this.upsert(id, {
        status: "pending",
        progress: 0,
        downloadedBytes: 0,
        totalBytes: resolved.sizeBytes ?? 0,
        error: undefined,
      });

      // Download package descriptor bytes (JSON bundle)
      const dl = await secureDownloader.download({
        packageId: id,
        url: resolved.downloadUrl,
        // integrityChecker expects bare hex
        expectedChecksum: expectedChecksum || undefined,
        signal: controller.signal,
        onProgress: p => {
          this.upsert(id, {
            status: p.status,
            progress: Math.max(0, Math.min(90, p.progress ?? 0)),
            downloadedBytes: p.downloadedBytes ?? 0,
            totalBytes: p.totalBytes ?? resolved.sizeBytes ?? 0,
            speedBps: p.speedBps ?? 0,
            estimatedTimeRemaining: p.estimatedTimeRemaining ?? 0,
          });
        },
      });

      if (!dl.success || !dl.data) {
        this.upsert(id, { status: "failed", error: dl.error || "Download failed" });
        return;
      }

      this.upsert(id, { status: "downloading", progress: 95, downloadedBytes: dl.data.byteLength });

      const install = await extractAndInstallPackageBytes({
        packageId: id,
        data: dl.data,
        expectedChecksum: resolved.checksum,
      });

      if (!install.success) {
        this.upsert(id, { status: "failed", error: install.error || "Install failed" });
        return;
      }

      this.upsert(id, { status: "completed", progress: 100 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      this.upsert(id, { status: "failed", error: message });
    } finally {
      this.controllers.delete(id);
    }
  }

  cancelDownload(packageId: string): void {
    const id = String(packageId || "").trim();
    if (!id) return;
    const controller = this.controllers.get(id);
    if (controller) controller.abort();
    this.controllers.delete(id);
    this.upsert(id, { status: "cancelled" });
  }

  pauseDownload(packageId: string): void {
    const id = String(packageId || "").trim();
    if (!id) return;
    const controller = this.controllers.get(id);
    if (controller) controller.abort();
    this.controllers.delete(id);
    this.upsert(id, { status: "paused" });
  }

  async resumeDownload(packageId: string): Promise<void> {
    const id = String(packageId || "").trim();
    if (!id) return;
    // Current implementation restarts download (descriptor is small); resume is handled by SecureDownloader when supported.
    await this.queueDownload(id, 0);
  }

  async retryDownload(packageId: string): Promise<void> {
    await this.queueDownload(packageId, 0);
  }

  clearCompletedDownloads(): void {
    for (const [id, p] of this.progressByPackageId.entries()) {
      if (p.status === "completed" || p.status === "failed" || p.status === "cancelled") {
        this.progressByPackageId.delete(id);
      }
    }
    this.emit();
  }

  isContentCached(packageId: string): boolean {
    return isContentInstalled(packageId);
  }

  async getCachedContent(packageId: string): Promise<ArrayBuffer | null> {
    // Provide a small but useful payload: the installed manifest JSON (if present).
    const manifest = await getInstalledManifest(packageId);
    if (!manifest) return null;
    try {
      const text = JSON.stringify(manifest);
      return new TextEncoder().encode(text).buffer;
    } catch {
      return null;
    }
  }

  async deleteCachedContent(packageId: string): Promise<void> {
    const id = String(packageId || "").trim();
    if (!id) return;

    try {
      localStorage.removeItem(`dlc_content_manifest:${id}`);
      localStorage.removeItem(`dlc_content_version:${id}`);
      localStorage.removeItem(`dlc_content_installed_at:${id}`);
    } catch {
      // ignore
    }

    try {
      await deletePackageFiles(id);
    } catch (err) {
      logger.warn("[dlc] deleteCachedContent failed", { packageId: id, error: err });
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      return await getPackageBytesUsed();
    } catch {
      return 0;
    }
  }
}

export const downloadManager = new DownloadManager();

