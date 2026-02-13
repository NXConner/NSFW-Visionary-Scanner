import { logger } from "@/lib/logger";
import { STORAGE_KEY } from "./constants";
import type { DownloadQueueItem } from "./types";

export function saveQueueToStorage(queue: Map<string, DownloadQueueItem>): void {
  const data = Array.from(queue.entries());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadQueueFromStorage(queue: Map<string, DownloadQueueItem>): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const data = JSON.parse(stored) as [string, DownloadQueueItem][];
    data.forEach(([key, value]) => {
      value.addedAt = new Date(value.addedAt);
      if (value.status === "downloading") value.status = "pending";
      queue.set(key, value);
    });
  } catch (error) {
    logger.warn("DownloadManager: Failed to load queue from storage", { error });
  }
}
