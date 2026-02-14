import { toast } from "sonner";

import { logger } from "@/lib/logger";

import { downloadContentPackage } from "./download";
import { extractContentPackage } from "./extract";
import { installContentPackage } from "./install";
import { verifyPackageChecksum } from "./verify";

/**
 * Complete DLC content download and installation flow
 */
export const downloadAndInstallDLC = async (
  packageId: string,
  packageUrl: string,
  expectedChecksum: string,
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; error?: string }> => {
  try {
    toast.info("Downloading DLC content...");

    const downloadResult = await downloadContentPackage(packageUrl, onProgress);
    if (!downloadResult.success || !downloadResult.data) {
      return { success: false, error: downloadResult.error || "Download failed" };
    }

    return await extractAndInstallPackageBytes({
      packageId,
      data: downloadResult.data,
      expectedChecksum,
      onProgress,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("DLC download and installation failed", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

export async function extractAndInstallPackageBytes(params: {
  packageId: string;
  data: ArrayBuffer;
  expectedChecksum: string;
  onProgress?: (progress: number) => void;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify checksum
    toast.info("Verifying package integrity...");
    const isValid = await verifyPackageChecksum(params.data, params.expectedChecksum);
    if (!isValid) {
      return { success: false, error: "Package checksum verification failed" };
    }

    // Extract package
    toast.info("Extracting content...");
    const extractResult = await extractContentPackage(params.data);
    if (!extractResult.success || !extractResult.manifest || !extractResult.files) {
      return { success: false, error: extractResult.error || "Extraction failed" };
    }

    // Install package
    toast.info("Installing content...");
    const installResult = await installContentPackage(
      params.packageId,
      extractResult.manifest,
      extractResult.files,
    );

    return installResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("DLC bundle install failed", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
