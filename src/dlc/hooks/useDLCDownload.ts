/**
 * DLC Download Hook
 * Manages download progress and offline content
 */

import { useState, useEffect, useCallback } from "react";
import { downloadManager } from "../core/DownloadManager";
import type { DownloadProgress } from "../core/types";

interface QueueStatus {
  queued: number;
  downloading: number;
  completed: number;
  failed: number;
}

interface UseDLCDownloadReturn {
  // State
  activeDownloads: DownloadProgress[];
  queueStatus: QueueStatus;
  storageUsed: number;

  // Actions
  startDownload: (packageId: string, priority?: number) => Promise<void>;
  cancelDownload: (packageId: string) => void;
  pauseDownload: (packageId: string) => void;
  resumeDownload: (packageId: string) => Promise<void>;
  retryDownload: (packageId: string) => Promise<void>;
  clearCompleted: () => void;

  // Offline
  isAvailableOffline: (packageId: string) => Promise<boolean>;
  getOfflineContent: (packageId: string) => Promise<ArrayBuffer | null>;
  deleteOfflineContent: (packageId: string) => Promise<void>;

  // Utilities
  refreshStorageInfo: () => Promise<void>;
}

export function useDLCDownload(): UseDLCDownloadReturn {
  const [activeDownloads, setActiveDownloads] = useState<DownloadProgress[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    queued: 0,
    downloading: 0,
    completed: 0,
    failed: 0,
  });
  const [storageUsed, setStorageUsed] = useState(0);

  // Subscribe to download progress updates
  useEffect(() => {
    const unsubscribe = downloadManager.subscribe(downloads => {
      setActiveDownloads(downloads);

      // Calculate queue status
      const status = downloads.reduce(
        (acc, d) => {
          if (d.status === "pending") acc.queued++;
          else if (d.status === "downloading") acc.downloading++;
          else if (d.status === "completed") acc.completed++;
          else if (d.status === "failed") acc.failed++;
          return acc;
        },
        { queued: 0, downloading: 0, completed: 0, failed: 0 },
      );

      setQueueStatus(status);
    });

    return unsubscribe;
  }, []);

  // Start a download
  const startDownload = useCallback(
    async (packageId: string, priority: number = 0): Promise<void> => {
      await downloadManager.queueDownload(packageId, priority);
    },
    [],
  );

  // Cancel download
  const cancelDownload = useCallback((packageId: string) => {
    downloadManager.cancelDownload(packageId);
  }, []);

  // Pause download
  const pauseDownload = useCallback((packageId: string) => {
    downloadManager.pauseDownload(packageId);
  }, []);

  // Resume download
  const resumeDownload = useCallback(async (packageId: string): Promise<void> => {
    await downloadManager.resumeDownload(packageId);
  }, []);

  // Retry download
  const retryDownload = useCallback(async (packageId: string): Promise<void> => {
    await downloadManager.retryDownload(packageId);
  }, []);

  // Clear completed
  const clearCompleted = useCallback(() => {
    downloadManager.clearCompletedDownloads();
  }, []);

  // Check offline availability
  const isAvailableOffline = useCallback(async (packageId: string): Promise<boolean> => {
    return downloadManager.isContentCached(packageId);
  }, []);

  // Get offline content
  const getOfflineContent = useCallback(async (packageId: string): Promise<ArrayBuffer | null> => {
    return downloadManager.getCachedContent(packageId);
  }, []);

  // Refresh storage info
  const refreshStorageInfo = useCallback(async () => {
    const used = await downloadManager.getCacheSize();
    setStorageUsed(used);
  }, []);

  // Delete offline content
  const deleteOfflineContent = useCallback(
    async (packageId: string): Promise<void> => {
      await downloadManager.deleteCachedContent(packageId);
      await refreshStorageInfo();
    },
    [refreshStorageInfo],
  );

  // Initial storage check
  useEffect(() => {
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  return {
    activeDownloads,
    queueStatus,
    storageUsed,
    startDownload,
    cancelDownload,
    pauseDownload,
    resumeDownload,
    retryDownload,
    clearCompleted,
    isAvailableOffline,
    getOfflineContent,
    deleteOfflineContent,
    refreshStorageInfo,
  };
}

export default useDLCDownload;
