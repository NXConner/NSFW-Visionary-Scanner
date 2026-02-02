/**
 * NSFW Detection Result Cache
 * Caches classification results to avoid redundant ML inference
 * Performance improvement: ~50-200ms per cached result
 */

import type { NsfwDetectionResult } from "./types";

interface CacheEntry {
  result: NsfwDetectionResult;
  timestamp: number;
  imageHash: string;
}

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 100;

/**
 * Calculate a simple hash of image data for cache key
 */
async function calculateImageHash(dataUrl: string): Promise<string> {
  try {
    const base64Data = dataUrl.split(",")[1];
    if (!base64Data) return "";

    // Use SubtleCrypto for fast hashing
    const data = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}

class NsfwCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];

  async get(dataUrl: string): Promise<NsfwDetectionResult | null> {
    const hash = await calculateImageHash(dataUrl);
    if (!hash) return null;

    const entry = this.cache.get(hash);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
      this.cache.delete(hash);
      this.accessOrder = this.accessOrder.filter(h => h !== hash);
      return null;
    }

    // Update access order for LRU
    this.accessOrder = this.accessOrder.filter(h => h !== hash);
    this.accessOrder.push(hash);

    return entry.result;
  }

  async set(dataUrl: string, result: NsfwDetectionResult): Promise<void> {
    const hash = await calculateImageHash(dataUrl);
    if (!hash) return;

    // Enforce max cache size (LRU eviction)
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestHash = this.accessOrder.shift();
      if (oldestHash) {
        this.cache.delete(oldestHash);
      }
    }

    this.cache.set(hash, {
      result,
      timestamp: Date.now(),
      imageHash: hash,
    });
    this.accessOrder.push(hash);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
    };
  }
}

// Singleton instance
export const nsfwCache = new NsfwCache();
