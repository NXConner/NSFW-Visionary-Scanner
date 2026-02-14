export type DownloadStatus =
  | "pending"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type DownloadProgress = {
  packageId: string;
  status: DownloadStatus;
  progress: number; // 0..100
  downloadedBytes: number;
  totalBytes: number;
  speedBps: number;
  estimatedTimeRemaining: number; // seconds
  error?: string;
};

export type DLCDownload = {
  id: string;
  userId: string;
  packageId: string;
  deviceId: string;
  url: string;
  status: DownloadStatus;
  progress: number;
  downloadedBytes: number;
  totalBytes?: number;
  createdAt: Date;
};

