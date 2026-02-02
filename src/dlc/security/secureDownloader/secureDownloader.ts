import { logger } from "@/lib/logger";
import { integrityChecker } from "../ContentEncryption";
import type { DownloadProgress } from "@/dlc/core/types";
import { CHUNK_SIZE } from "./constants";
import { downloadChunked } from "./downloadChunked";
import { downloadSingle } from "./downloadSingle";
import { clearResume } from "./resumeDb";
import { combineSignals, updateProgress } from "./utils";

export type DownloadOptions = {
  packageId: string;
  url: string;
  expectedChecksum?: string;
  encryptionKeyId?: string;
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
};

export type DownloadResult = {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
  checksum?: string;
  downloadedBytes: number;
  durationMs: number;
};

class SecureDownloader {
  private activeDownloads: Map<string, AbortController> = new Map();
  private downloadProgress: Map<string, DownloadProgress> = new Map();

  async download(options: DownloadOptions): Promise<DownloadResult> {
    const { packageId, url, expectedChecksum, onProgress, signal } = options;
    const startTime = Date.now();

    logger.info("SecureDownloader: Starting download", { packageId, url });

    const controller = new AbortController();
    this.activeDownloads.set(packageId, controller);
    const combinedSignal = signal ? combineSignals(controller.signal, signal) : controller.signal;

    try {
      onProgress?.(
        updateProgress(this.downloadProgress, packageId, {
          packageId,
          status: "pending",
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          speedBps: 0,
          estimatedTimeRemaining: 0,
        }),
      );

      // Some signed URLs or CDNs may block HEAD or omit range support.
      // Fall back to a direct stream download if metadata is unavailable.
      let totalBytes = 0;
      let supportsRanges = false;
      try {
        const headResponse = await fetch(url, { method: "HEAD", signal: combinedSignal });
        if (headResponse.ok) {
          totalBytes = parseInt(headResponse.headers.get("Content-Length") || "0", 10);
          supportsRanges = headResponse.headers.get("Accept-Ranges") === "bytes";
        } else {
          logger.warn("SecureDownloader: HEAD not ok, falling back to GET stream", {
            packageId,
            status: headResponse.status,
          });
        }
      } catch (err) {
        logger.warn("SecureDownloader: HEAD failed, falling back to GET stream", { packageId });
        void err;
      }

      onProgress?.(
        updateProgress(this.downloadProgress, packageId, { status: "downloading", totalBytes }),
      );

      const data =
        supportsRanges && totalBytes > CHUNK_SIZE * 2
          ? await downloadChunked({
              packageId,
              url,
              totalBytes,
              signal: combinedSignal,
              downloadProgress: this.downloadProgress,
              onProgress,
            })
          : await downloadSingle({
              packageId,
              url,
              signal: combinedSignal,
              downloadProgress: this.downloadProgress,
              onProgress,
            });

      if (expectedChecksum) {
        const actualChecksum = await integrityChecker.calculateHash(data);
        if (!(await integrityChecker.verify(data, expectedChecksum)))
          throw new Error("Checksum verification failed");
        logger.info("SecureDownloader: Checksum verified", { packageId });
        void actualChecksum;
      }

      onProgress?.(
        updateProgress(this.downloadProgress, packageId, {
          status: "completed",
          progress: 100,
          downloadedBytes: data.byteLength,
        }),
      );

      const durationMs = Date.now() - startTime;
      logger.info("SecureDownloader: Download completed", {
        packageId,
        bytes: data.byteLength,
        durationMs,
      });

      return {
        success: true,
        data,
        checksum: expectedChecksum ? await integrityChecker.calculateHash(data) : undefined,
        downloadedBytes: data.byteLength,
        durationMs,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed";
      onProgress?.(
        updateProgress(this.downloadProgress, packageId, { status: "failed", error: message }),
      );
      logger.error("SecureDownloader: Download failed", { packageId, error: message });
      return {
        success: false,
        error: message,
        downloadedBytes: this.downloadProgress.get(packageId)?.downloadedBytes || 0,
        durationMs: Date.now() - startTime,
      };
    } finally {
      this.activeDownloads.delete(packageId);
    }
  }

  cancelDownload(packageId: string): void {
    const controller = this.activeDownloads.get(packageId);
    if (controller) controller.abort();
    updateProgress(this.downloadProgress, packageId, { status: "cancelled" });
    logger.info("SecureDownloader: Download cancelled", { packageId });
    void clearResume(packageId);
  }

  pauseDownload(packageId: string): void {
    const controller = this.activeDownloads.get(packageId);
    if (controller) controller.abort();
    updateProgress(this.downloadProgress, packageId, { status: "paused" });
  }

  getProgress(packageId: string): DownloadProgress | undefined {
    return this.downloadProgress.get(packageId);
  }

  getActiveDownloads(): DownloadProgress[] {
    return Array.from(this.downloadProgress.values()).filter(
      p => p.status === "downloading" || p.status === "pending",
    );
  }
}

export const secureDownloader = new SecureDownloader();
