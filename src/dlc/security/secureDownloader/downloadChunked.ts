import type { DownloadProgress } from "@/dlc/core/types";
import { CHUNK_SIZE, MAX_RETRIES, RETRY_DELAY_MS } from "./constants";
import { clearResume, loadChunk, loadResumeMeta, saveChunk, saveResumeMeta } from "./resumeDb";
import { delay, updateProgress } from "./utils";

export async function downloadChunked(params: {
  packageId: string;
  url: string;
  totalBytes: number;
  signal: AbortSignal;
  downloadProgress: Map<string, DownloadProgress>;
  onProgress?: (progress: DownloadProgress) => void;
}): Promise<ArrayBuffer> {
  const { packageId, url, totalBytes, signal, downloadProgress, onProgress } = params;

  const resumeMeta = await loadResumeMeta(packageId);
  const canResume =
    resumeMeta &&
    resumeMeta.url === url &&
    resumeMeta.totalBytes === totalBytes &&
    resumeMeta.chunkSize === CHUNK_SIZE;
  if (!canResume) {
    await clearResume(packageId);
    await saveResumeMeta({
      packageId,
      url,
      totalBytes,
      chunkSize: CHUNK_SIZE,
      createdAt: Date.now(),
    });
  }

  const chunks: { start: number; end: number }[] = [];
  for (let start = 0; start < totalBytes; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE - 1, totalBytes - 1);
    chunks.push({ start, end });
  }

  const parallelLimit = 4;
  const downloadedChunks: (Uint8Array | null)[] = new Array(chunks.length).fill(null);
  let downloadedBytes = 0;
  const startTime = Date.now();

  for (let i = 0; i < chunks.length; i++) {
    const cached = await loadChunk(packageId, i);
    if (cached) {
      downloadedChunks[i] = cached;
      downloadedBytes += cached.byteLength;
    }
  }

  if (downloadedBytes > 0) {
    const elapsedMs = Date.now() - startTime || 1;
    const speedBps = downloadedBytes / (elapsedMs / 1000);
    const remainingBytes = totalBytes - downloadedBytes;
    const eta = remainingBytes / (speedBps || 1);
    onProgress?.(
      updateProgress(downloadProgress, packageId, {
        downloadedBytes,
        progress: Math.round((downloadedBytes / totalBytes) * 100),
        speedBps,
        estimatedTimeRemaining: Math.round(eta),
      }),
    );
  }

  const downloadOne = async (index: number): Promise<void> => {
    if (downloadedChunks[index]) return;
    const { start, end } = chunks[index];

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      try {
        const response = await fetch(url, { headers: { Range: `bytes=${start}-${end}` }, signal });
        if (!response.ok && response.status !== 206)
          throw new Error(`Chunk download failed: ${response.status}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        downloadedChunks[index] = bytes;
        downloadedBytes += bytes.byteLength;
        await saveChunk(packageId, index, bytes);

        const elapsedMs = Date.now() - startTime || 1;
        const speedBps = downloadedBytes / (elapsedMs / 1000);
        const remainingBytes = totalBytes - downloadedBytes;
        const eta = remainingBytes / (speedBps || 1);
        onProgress?.(
          updateProgress(downloadProgress, packageId, {
            downloadedBytes,
            progress: Math.round((downloadedBytes / totalBytes) * 100),
            speedBps,
            estimatedTimeRemaining: Math.round(eta),
          }),
        );
        return;
      } catch (err) {
        if (retry === MAX_RETRIES - 1) throw err;
        await delay(RETRY_DELAY_MS * (retry + 1));
      }
    }
  };

  const queue = [...Array(chunks.length).keys()];
  const active: Promise<void>[] = [];

  while (queue.length > 0 || active.length > 0) {
    while (active.length < parallelLimit && queue.length > 0) {
      const idx = queue.shift()!;
      const p = downloadOne(idx).then(() => {
        const i = active.indexOf(p);
        if (i > -1) active.splice(i, 1);
      });
      active.push(p);
    }
    if (active.length > 0) await Promise.race(active);
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of downloadedChunks) {
    if (chunk) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
  }

  await clearResume(packageId);
  return result.buffer;
}
