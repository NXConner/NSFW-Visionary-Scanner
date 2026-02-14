import { toast } from "sonner";

import { logger } from "@/lib/logger";

import type { ContentFile, ContentPackageManifest } from "./types";
import { setInstalledAt, setInstalledManifest, setInstalledVersion } from "./localState";
import { maybeDecryptFile, resolveContentFileUrl } from "./resolve";
import { storeContentFile } from "./storage";
import { normalizeChecksumHex } from "./utils";

/**
 * Install content package (downloads referenced files and stores in IndexedDB)
 */
export const installContentPackage = async (
  packageId: string,
  manifest: ContentPackageManifest,
  files: ContentFile[],
): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info("Installing content package", { version: manifest.version });

    setInstalledManifest(packageId, manifest);

    const filePromises = files.map(async file => {
      try {
        const resolved = await resolveContentFileUrl({ packageId, file });
        const response = await fetch(resolved.url);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${file.path}`);
        }

        const fetchedBytes = await response.arrayBuffer();
        const arrayBuffer = await maybeDecryptFile({
          packageId,
          file,
          response,
          bytes: fetchedBytes,
        });

        // Verify file checksum
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        if (hashHex !== normalizeChecksumHex(file.checksum)) {
          throw new Error(`Checksum mismatch for file: ${file.path}`);
        }

        await storeContentFile({ packageId, path: file.path, data: arrayBuffer });
        logger.info("File installed", { packageId, path: file.path, assetRef: resolved.assetRef });
      } catch (error) {
        logger.error("Failed to install file", {
          path: file.path,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    });

    await Promise.all(filePromises);

    setInstalledVersion(packageId, manifest.version);
    setInstalledAt(packageId, new Date().toISOString());

    logger.info("Content package installed successfully", { version: manifest.version });
    toast.success("DLC content installed successfully!");

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to install content package", { error: errorMessage });
    toast.error("Failed to install content package");
    return { success: false, error: errorMessage };
  }
};
