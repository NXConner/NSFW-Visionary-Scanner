import type { DownloadProgress, DownloadStatus } from "@/dlc/core/types";

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", () => controller.abort());
  }
  return controller.signal;
}

export function updateProgress(
  downloadProgress: Map<string, DownloadProgress>,
  packageId: string,
  updates: Partial<DownloadProgress>,
): DownloadProgress {
  const current =
    downloadProgress.get(packageId) ||
    ({
      packageId,
      status: "pending" as DownloadStatus,
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speedBps: 0,
      estimatedTimeRemaining: 0,
    } satisfies DownloadProgress);

  const next = { ...current, ...updates };
  downloadProgress.set(packageId, next);
  return next;
}
