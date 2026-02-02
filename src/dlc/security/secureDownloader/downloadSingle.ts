import type { DownloadProgress } from "@/dlc/core/types";
import { updateProgress } from "./utils";

export async function downloadSingle(params: {
  packageId: string;
  url: string;
  signal: AbortSignal;
  downloadProgress: Map<string, DownloadProgress>;
  onProgress?: (progress: DownloadProgress) => void;
}): Promise<ArrayBuffer> {
  const { packageId, url, signal, downloadProgress, onProgress } = params;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);

  const totalBytes = parseInt(response.headers.get("Content-Length") || "0", 10);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body not readable");

  const chunks: Uint8Array[] = [];
  let downloadedBytes = 0;
  const startTime = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    downloadedBytes += value.length;

    const elapsedMs = Date.now() - startTime;
    const speedBps = downloadedBytes / ((elapsedMs || 1) / 1000);
    const remainingBytes = totalBytes - downloadedBytes;
    const eta = remainingBytes / (speedBps || 1);

    onProgress?.(
      updateProgress(downloadProgress, packageId, {
        downloadedBytes,
        progress: totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0,
        speedBps,
        estimatedTimeRemaining: Math.round(eta),
      }),
    );
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}
