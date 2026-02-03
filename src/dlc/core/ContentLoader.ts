import { downloadManager } from "./DownloadManager";
import { logger } from "@/lib/logger";

class DLCContentLoader {
  async loadPackageContent(packageId: string): Promise<ArrayBuffer | null> {
    try {
      const cached = await downloadManager.getCachedContent(packageId);
      if (cached) return cached;

      await downloadManager.queueDownload(packageId, 0);
      return await downloadManager.getCachedContent(packageId);
    } catch (error) {
      logger.warn("DLCContentLoader: Failed to load content", {
        packageId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }
}

export const dlcContentLoader = new DLCContentLoader();
