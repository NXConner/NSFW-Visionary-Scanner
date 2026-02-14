import { logger } from "@/lib/logger";

import type { ContentFile, ContentPackageManifest } from "./types";

/**
 * Extract content package
 */
export const extractContentPackage = async (
  data: ArrayBuffer,
): Promise<{
  success: boolean;
  manifest?: ContentPackageManifest;
  files?: ContentFile[];
  error?: string;
}> => {
  try {
    // Current supported format: a JSON bundle of { manifest, files }.
    // (We intentionally keep this simple and deterministic for integrity verification.)
    const text = new TextDecoder().decode(data);
    const packageData = JSON.parse(text);

    if (!packageData.manifest || !packageData.files) {
      throw new Error("Invalid package format");
    }

    const manifest: ContentPackageManifest = packageData.manifest;
    const files: ContentFile[] = packageData.files;

    logger.info("Content package extracted", {
      version: manifest.version,
      fileCount: files.length,
    });

    return { success: true, manifest, files };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to extract content package", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};
