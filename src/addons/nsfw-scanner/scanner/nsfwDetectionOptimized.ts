/**
 * Optimized NSFW Detection with Web Worker & Caching
 * This is a performance-enhanced version of nsfwDetection.ts
 */

import type { NsfwDetectionResult } from "./types";
import { nsfwCache } from "./nsfwCache";

type WorkerMessage =
  | { type: "load"; modelUrl?: string }
  | { type: "detect"; dataUrl: string; explicitThreshold: number; suggestiveThreshold: number };

type WorkerResponse =
  | { type: "loaded"; success: boolean; error?: string }
  | { type: "result"; result: NsfwDetectionResult }
  | { type: "error"; error: string };

let worker: Worker | null = null;
let workerReady = false;
let workerInitPromise: Promise<void> | null = null;

/**
 * Initialize the web worker
 */
async function initWorker(): Promise<void> {
  if (workerReady) return;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = new Promise((resolve, reject) => {
    try {
      // Create worker from separate file
      worker = new Worker(new URL("./nsfwDetection.worker.ts", import.meta.url), {
        type: "module",
      });

      const timeout = setTimeout(() => {
        reject(new Error("Worker initialization timeout"));
      }, 30000); // 30s timeout

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === "loaded") {
          clearTimeout(timeout);
          workerReady = true;
          resolve();
        }
      };

      worker.onerror = error => {
        clearTimeout(timeout);
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Load model
      worker.postMessage({ type: "load" } as WorkerMessage);
    } catch (error) {
      reject(error);
    }
  });

  return workerInitPromise;
}

/**
 * Detect NSFW content with caching and web worker
 */
export async function detectNsfwOptimized(
  dataUrl: string,
  opts: { explicitThreshold: number; suggestiveThreshold: number },
): Promise<NsfwDetectionResult> {
  // Check cache first
  const cached = await nsfwCache.get(dataUrl);
  if (cached) {
    return cached;
  }

  // Ensure worker is ready
  try {
    await initWorker();
  } catch (error) {
    // Fallback to main thread if worker fails
    const { detectNsfwFromDataUrl } = await import("./nsfwDetection");
    const result = await detectNsfwFromDataUrl(dataUrl, opts);
    await nsfwCache.set(dataUrl, result);
    return result;
  }

  // Use worker for detection
  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(new Error("Worker not initialized"));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error("Detection timeout"));
    }, 10000); // 10s timeout

    const messageHandler = async (event: MessageEvent<WorkerResponse>) => {
      clearTimeout(timeout);
      worker?.removeEventListener("message", messageHandler);

      if (event.data.type === "result") {
        const result = event.data.result;
        await nsfwCache.set(dataUrl, result);
        resolve(result);
      } else if (event.data.type === "error") {
        reject(new Error(event.data.error));
      }
    };

    worker.addEventListener("message", messageHandler);
    worker.postMessage({
      type: "detect",
      dataUrl,
      explicitThreshold: opts.explicitThreshold,
      suggestiveThreshold: opts.suggestiveThreshold,
    } as WorkerMessage);
  });
}

/**
 * Preload the model and worker
 */
export async function preloadNsfwDetector(): Promise<void> {
  await initWorker();
}

/**
 * Get cache statistics
 */
export function getNsfwCacheStats() {
  return nsfwCache.getStats();
}

/**
 * Clear detection cache
 */
export function clearNsfwCache() {
  nsfwCache.clear();
}
