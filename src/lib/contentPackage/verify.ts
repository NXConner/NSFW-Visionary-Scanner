import { logger } from "@/lib/logger";

import { normalizeChecksumHex } from "./utils";

/**
 * Verify package checksum (SHA-256)
 */
export const verifyPackageChecksum = async (
  data: ArrayBuffer,
  expectedChecksum: string,
): Promise<boolean> => {
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const isValid = hashHex === normalizeChecksumHex(expectedChecksum);

    if (!isValid) {
      logger.error("Package checksum verification failed", {
        expected: expectedChecksum,
        actual: hashHex,
      });
    }

    return isValid;
  } catch (error) {
    logger.error("Error verifying package checksum", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
};
