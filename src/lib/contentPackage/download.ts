import { logger } from "@/lib/logger";

/**
 * Download content package (bytes)
 */
export const downloadContentPackage = async (
  packageUrl: string,
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> => {
  try {
    logger.info("Starting content package download", { packageUrl });

    const response = await fetch(packageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (onProgress && contentLength > 0) {
        const progress = (receivedLength / contentLength) * 100;
        onProgress(progress);
      }
    }

    // Combine chunks into single ArrayBuffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    logger.info("Content package downloaded successfully", {
      size: receivedLength,
      packageUrl,
    });

    return { success: true, data: result.buffer };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to download content package", {
      error: errorMessage,
      packageUrl,
    });
    return { success: false, error: errorMessage };
  }
};
