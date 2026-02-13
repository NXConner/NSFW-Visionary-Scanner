import { logger } from "@/lib/logger";
import { dlcManager } from "../DLCManager";
import { dlcRegistry } from "../DLCRegistry";
import { secureDownloader } from "../../security/SecureDownloader";
import { extractAndInstallPackageBytes } from "@/lib/contentPackage";
import type { DownloadProgress } from "../types";
import { MAX_CONCURRENT_DOWNLOADS } from "./constants";
import type { DownloadQueueItem } from "./types";
import { loadQueueFromStorage, saveQueueToStorage } from "./queueStorage";
import {
  getCacheSize,
  getCachedContent,
  isContentCached,
  storeContent,
  deleteCachedContent,
} from "./contentDb";
import { supabase } from "@/integrations/supabase/client";

interface ResolveUrlResult {
  url: string;
  expiresAt?: Date;
}

async function resolvePackageDownloadUrl(params: {
  packageId: string;
  downloadUrlOrAssetPath: string;
  expiresInSeconds?: number;
}): Promise<ResolveUrlResult> {
  const { packageId, downloadUrlOrAssetPath, expiresInSeconds = 3600 } = params;
  
  // If it's already a full URL, return as-is
  if (downloadUrlOrAssetPath.startsWith("http://") || downloadUrlOrAssetPath.startsWith("https://")) {
    return { url: downloadUrlOrAssetPath };
  }

  // Handle Supabase storage paths (format: storage://bucket/path)
  if (downloadUrlOrAssetPath.startsWith("storage://")) {
    const storagePath = downloadUrlOrAssetPath.replace("storage://", "");
    const [bucket, ...pathParts] = storagePath.split("/");
    const filePath = pathParts.join("/");

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      throw new Error(`Failed to resolve download URL: ${error.message}`);
    }

    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  // Fallback: use edge function
  const { data, error } = await supabase.functions.invoke("get-dlc-signed-url", {
    body: { packageId, assetPath: downloadUrlOrAssetPath },
  });

  if (error) {
    throw new Error(`Failed to resolve download URL: ${error.message}`);
  }

  return {
    url: data.signedUrl,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
  };
}

class DownloadManager {
  private downloadQueue: Map<string, DownloadQueueItem> = new Map();
  private listeners: Set<(downloads: DownloadProgress[]) => void> = new Set();
  private isProcessing: boolean = false;

  constructor() {
    loadQueueFromStorage(this.downloadQueue);
  }

  subscribe(listener: (downloads: DownloadProgress[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const downloads = this.getAllDownloads();
    this.listeners.forEach(listener => listener(downloads));
  }

  async queueDownload(packageId: string, priority: number = 0): Promise<void> {
    if (this.downloadQueue.has(packageId)) {
      logger.debug("DownloadManager: Package already in queue", { packageId });
      return;
    }

    if (!dlcManager.ownsPackage(packageId)) throw new Error("License required to download");

    const validation = await dlcManager.validateLicense(packageId);
    if (!validation.isValid) throw new Error(validation.error || "Invalid license");

    this.downloadQueue.set(packageId, {
      packageId,
      priority,
      status: "pending",
      addedAt: new Date(),
    });
    saveQueueToStorage(this.downloadQueue);

    logger.info("DownloadManager: Package queued for download", { packageId });
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      while (true) {
        const active = Array.from(this.downloadQueue.values()).filter(
          i => i.status === "downloading",
        );
        if (active.length >= MAX_CONCURRENT_DOWNLOADS) break;

        const next = Array.from(this.downloadQueue.values())
          .filter(i => i.status === "pending")
          .sort((a, b) => b.priority - a.priority)[0];
        if (!next) break;

        await this.startDownload(next.packageId);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async startDownload(packageId: string): Promise<void> {
    const pkg = dlcRegistry.getPackage(packageId);
    if (!pkg) throw new Error("Package not found");

    const queueItem = this.downloadQueue.get(packageId);
    if (queueItem) {
      queueItem.status = "downloading";
      saveQueueToStorage(this.downloadQueue);
    }

    logger.info("DownloadManager: Starting download", { packageId });

    try {
      if (!pkg.downloadUrl) {
        throw new Error("Package download URL not configured");
      }
      if (!pkg.checksumSha256) {
        throw new Error("Package checksum not configured");
      }

      const { url } = await resolvePackageDownloadUrl({
        packageId,
        downloadUrlOrAssetPath: pkg.downloadUrl,
        expiresInSeconds: 60 * 60,
      });

      const result = await secureDownloader.download({
        packageId,
        url,
        expectedChecksum: pkg.checksumSha256,
        onProgress: () => this.notifyListeners(),
      });

      if (!result.success) throw new Error(result.error || "Download failed");
      // Persist raw bundle bytes for recovery/debugging (not used for access control).
      await storeContent(packageId, result.data!);

      // Install extracted content into DLC content storage.
      const installResult = await extractAndInstallPackageBytes({
        packageId,
        data: result.data!,
        expectedChecksum: pkg.checksumSha256,
      });
      if (!installResult.success) {
        throw new Error(installResult.error || "Install failed");
      }

      this.downloadQueue.delete(packageId);
      saveQueueToStorage(this.downloadQueue);
      logger.info("DownloadManager: Download and install completed", { packageId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed";
      const item = this.downloadQueue.get(packageId);
      if (item) {
        item.status = "failed";
        saveQueueToStorage(this.downloadQueue);
      }
      logger.error("DownloadManager: Download failed", { packageId, error: message });
      throw error;
    } finally {
      this.notifyListeners();
      void this.processQueue();
    }
  }

  cancelDownload(packageId: string): void {
    secureDownloader.cancelDownload(packageId);
    this.downloadQueue.delete(packageId);
    saveQueueToStorage(this.downloadQueue);
    this.notifyListeners();
    logger.info("DownloadManager: Download cancelled", { packageId });
  }

  pauseDownload(packageId: string): void {
    secureDownloader.pauseDownload(packageId);
    const item = this.downloadQueue.get(packageId);
    if (item) {
      item.status = "paused";
      saveQueueToStorage(this.downloadQueue);
    }
    this.notifyListeners();
  }

  async resumeDownload(packageId: string): Promise<void> {
    const item = this.downloadQueue.get(packageId);
    if (item && item.status === "paused") {
      item.status = "pending";
      saveQueueToStorage(this.downloadQueue);
      await this.processQueue();
    }
  }

  async retryDownload(packageId: string): Promise<void> {
    const item = this.downloadQueue.get(packageId);
    if (item && item.status === "failed") {
      item.status = "pending";
      saveQueueToStorage(this.downloadQueue);
      await this.processQueue();
    }
  }

  getDownloadProgress(packageId: string): DownloadProgress | undefined {
    return secureDownloader.getProgress(packageId);
  }

  getAllDownloads(): DownloadProgress[] {
    return Array.from(this.downloadQueue.keys()).map(packageId => {
      const progress = secureDownloader.getProgress(packageId);
      const queueItem = this.downloadQueue.get(packageId)!;
      return (
        progress || {
          packageId,
          status: queueItem.status,
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          speedBps: 0,
          estimatedTimeRemaining: 0,
        }
      );
    });
  }

  getQueuedDownloads(): DownloadQueueItem[] {
    return Array.from(this.downloadQueue.values()).filter(item => item.status === "pending");
  }

  getActiveDownloads(): DownloadProgress[] {
    return this.getAllDownloads().filter(d => d.status === "downloading");
  }

  clearCompletedDownloads(): void {
    for (const [packageId, item] of this.downloadQueue) {
      if (item.status === "completed") this.downloadQueue.delete(packageId);
    }
    saveQueueToStorage(this.downloadQueue);
    this.notifyListeners();
  }

  async isContentCached(packageId: string): Promise<boolean> {
    return await isContentCached(packageId);
  }

  async getCachedContent(packageId: string): Promise<ArrayBuffer | null> {
    return await getCachedContent(packageId);
  }

  async deleteCachedContent(packageId: string): Promise<void> {
    await deleteCachedContent(packageId);
  }

  async getCacheSize(): Promise<number> {
    return await getCacheSize();
  }
}

export const downloadManager = new DownloadManager();
