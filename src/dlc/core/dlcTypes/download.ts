// ============================================
// Download Types
// ============================================

export type DownloadStatus =
  | "pending"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";
export type DownloadType = "full" | "delta" | "content_update";

export interface DLCDownload {
  id: string;
  userId: string;
  packageId: string;
  licenseId?: string;
  deviceId: string;

  // Download Info
  downloadUrl: string;
  downloadType: DownloadType;

  // Progress
  downloadStatus: DownloadStatus;
  downloadProgress: number; // 0-100
  downloadSpeedBps?: number;

  // Timing
  downloadStartedAt?: Date;
  downloadCompletedAt?: Date;
  estimatedTimeRemaining?: number; // seconds

  // File Info
  fileSizeBytes?: number;
  downloadedBytes: number;
  checksumExpected?: string;
  checksumVerified?: boolean;

  // Error Handling
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  maxRetries: number;

  createdAt: Date;
}

export interface DownloadProgress {
  packageId: string;
  status: DownloadStatus;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  speedBps: number;
  estimatedTimeRemaining: number;
  error?: string;
}
