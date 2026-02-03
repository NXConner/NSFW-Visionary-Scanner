import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { secureDownloader } from "../security/secureDownloader";
import type { DownloadProgress } from "./types";

type Subscriber = (downloads: DownloadProgress[]) => void;

const CACHE_NAME = "dlc-content-cache-v1";

const buildCacheRequest = (packageId: string): Request =>
  new Request(`https://dlc-cache.local/${encodeURIComponent(packageId)}`);

class DownloadManager {
  private subscribers = new Set<Subscriber>();
  private downloadProgress = new Map<string, DownloadProgress>();
  private activeDownloads = new Set<string>();

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getDownloads());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getDownloads(): DownloadProgress[] {
    return Array.from(this.downloadProgress.values());
  }

  private notify(): void {
    const downloads = this.getDownloads();
    this.subscribers.forEach(cb => cb(downloads));
  }

  private setProgress(progress: DownloadProgress): void {
    this.downloadProgress.set(progress.packageId, progress);
    this.notify();
  }

  private async resolveDownloadInfo(packageId: string): Promise<{
    url: string;
    checksum?: string;
  } | null> {
    try {
      const { data, error } = await supabase.functions.invoke("get-dlc-content", {
        body: { packageId },
      });

      if (error) {
        logger.error("DownloadManager: Failed to get DLC content", { packageId, error: error.message });
        return null;
      }

      const pkg = (data as { package?: Record<string, unknown> } | null)?.package;
      const downloadUrl =
        (pkg?.download_url as string | undefined) ||
        (pkg?.downloadUrl as string | undefined) ||
        (data as any)?.downloadUrl;
      if (!downloadUrl) {
        logger.warn("DownloadManager: No download URL for package", { packageId });
        return null;
      }

      return {
        url: String(downloadUrl),
        checksum: pkg?.checksum ? String(pkg.checksum) : undefined,
      };
    } catch (error) {
      logger.error("DownloadManager: Resolve download info failed", {
        packageId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  async queueDownload(packageId: string, _priority = 0): Promise<void> {
    if (this.activeDownloads.has(packageId)) return;
    this.activeDownloads.add(packageId);

    const info = await this.resolveDownloadInfo(packageId);
    if (!info) {
      this.setProgress({
        packageId,
        status: "failed",
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speedBps: 0,
        estimatedTimeRemaining: 0,
        error: "Download URL unavailable",
      });
      this.activeDownloads.delete(packageId);
      return;
    }

    const result = await secureDownloader.download({
      packageId,
      url: info.url,
      expectedChecksum: info.checksum,
      onProgress: progress => this.setProgress(progress),
    });

    if (result.success && result.data) {
      await this.cacheContent(packageId, result.data);
      this.setProgress({
        packageId,
        status: "completed",
        progress: 100,
        downloadedBytes: result.downloadedBytes,
        totalBytes: result.downloadedBytes,
        speedBps: 0,
        estimatedTimeRemaining: 0,
      });
    } else {
      this.setProgress({
        packageId,
        status: "failed",
        progress: 0,
        downloadedBytes: result.downloadedBytes,
        totalBytes: 0,
        speedBps: 0,
        estimatedTimeRemaining: 0,
        error: result.error || "Download failed",
      });
    }

    this.activeDownloads.delete(packageId);
  }

  cancelDownload(packageId: string): void {
    secureDownloader.cancelDownload(packageId);
    const progress = this.downloadProgress.get(packageId);
    if (progress) {
      this.setProgress({ ...progress, status: "cancelled" });
    }
    this.activeDownloads.delete(packageId);
  }

  pauseDownload(packageId: string): void {
    secureDownloader.pauseDownload(packageId);
    const progress = this.downloadProgress.get(packageId);
    if (progress) {
      this.setProgress({ ...progress, status: "paused" });
    }
  }

  async resumeDownload(packageId: string): Promise<void> {
    await this.queueDownload(packageId, 0);
  }

  async retryDownload(packageId: string): Promise<void> {
    const progress = this.downloadProgress.get(packageId);
    if (progress) {
      this.setProgress({ ...progress, status: "pending", error: undefined });
    }
    await this.queueDownload(packageId, 0);
  }

  clearCompletedDownloads(): void {
    for (const [id, progress] of this.downloadProgress) {
      if (progress.status === "completed" || progress.status === "cancelled") {
        this.downloadProgress.delete(id);
      }
    }
    this.notify();
  }

  getProgress(packageId: string): DownloadProgress | undefined {
    return this.downloadProgress.get(packageId);
  }

  getActiveDownloads(): DownloadProgress[] {
    return this.getDownloads().filter(
      d => d.status === "pending" || d.status === "downloading",
    );
  }

  async isContentCached(packageId: string): Promise<boolean> {
    if (typeof caches === "undefined") return false;
    const cache = await caches.open(CACHE_NAME);
    return Boolean(await cache.match(buildCacheRequest(packageId)));
  }

  async getCachedContent(packageId: string): Promise<ArrayBuffer | null> {
    if (typeof caches === "undefined") return null;
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(buildCacheRequest(packageId));
    if (!response) return null;
    return await response.arrayBuffer();
  }

  async deleteCachedContent(packageId: string): Promise<void> {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(buildCacheRequest(packageId));
  }

  async getCacheSize(): Promise<number> {
    if (typeof caches === "undefined") return 0;
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    let total = 0;
    for (const req of keys) {
      const resp = await cache.match(req);
      if (!resp) continue;
      const len = resp.headers.get("Content-Length");
      if (len) {
        total += Number.parseInt(len, 10);
      } else {
        const buf = await resp.clone().arrayBuffer();
        total += buf.byteLength;
      }
    }
    return total;
  }

  private async cacheContent(packageId: string, data: ArrayBuffer): Promise<void> {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(data, {
      headers: { "Content-Type": "application/octet-stream" },
    });
    await cache.put(buildCacheRequest(packageId), response);
  }
}

export const downloadManager = new DownloadManager();
