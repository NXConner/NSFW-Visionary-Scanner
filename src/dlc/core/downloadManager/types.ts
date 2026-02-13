import type { DownloadStatus } from "../types";

export interface DownloadQueueItem {
  packageId: string;
  priority: number;
  status: DownloadStatus;
  addedAt: Date;
}

export interface InstallResult {
  success: boolean;
  error?: string;
  packageId: string;
  installedVersion: string;
}
