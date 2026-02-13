import type { EdgeMap } from "../types";

/**
 * Optimized Sobel edge detection with inline index calculation.
 * Avoids function call overhead and uses direct array access.
 */
export function sobelEdges(gray: Uint8Array, width: number, height: number): Uint8Array {
  const len = width * height;
  const out = new Uint8Array(len);

  // Process inner pixels only (skip border)
  const h1 = height - 1;
  const w1 = width - 1;

  for (let y = 1; y < h1; y++) {
    const rowOffset = y * width;
    const prevRow = rowOffset - width;
    const nextRow = rowOffset + width;

    for (let x = 1; x < w1; x++) {
      // Inline index calculation - faster than function calls
      const a00 = gray[prevRow + x - 1]!;
      const a10 = gray[prevRow + x]!;
      const a20 = gray[prevRow + x + 1]!;
      const a01 = gray[rowOffset + x - 1]!;
      const a21 = gray[rowOffset + x + 1]!;
      const a02 = gray[nextRow + x - 1]!;
      const a12 = gray[nextRow + x]!;
      const a22 = gray[nextRow + x + 1]!;

      // Sobel kernels
      const gx = -a00 - (a01 << 1) - a02 + a20 + (a21 << 1) + a22;
      const gy = -a00 - (a10 << 1) - a20 + a02 + (a12 << 1) + a22;

      // Fast magnitude approximation (avoid Math.hypot for speed)
      // Using |gx| + |gy| is ~40% faster and good enough for edge detection
      const mag = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
      out[rowOffset + x] = mag > 255 ? 255 : mag;
    }
  }

  return out;
}

/**
 * Fast percentile-based auto threshold using sampling.
 */
export function autoThreshold(mag: Uint8Array): number {
  const len = mag.length;
  // Sample ~2000 pixels for speed (was 5000)
  const step = Math.max(1, (len / 2000) | 0);
  const sampleSize = ((len / step) | 0) + 1;
  const sample = new Uint8Array(sampleSize);

  let j = 0;
  for (let i = 0; i < len; i += step) {
    sample[j++] = mag[i]!;
  }

  // Use counting sort for Uint8 (O(n) instead of O(n log n))
  const counts = new Uint32Array(256);
  for (let i = 0; i < j; i++) {
    counts[sample[i]!]++;
  }

  // Find 90th percentile
  const target = (j * 0.9) | 0;
  let cumulative = 0;
  let t = 120;
  for (let v = 0; v < 256; v++) {
    cumulative += counts[v]!;
    if (cumulative >= target) {
      t = v;
      break;
    }
  }

  return t < 40 ? 40 : t > 220 ? 220 : t;
}

/**
 * Fast edge binarization with reduced branching.
 */
export function binarizeEdges(
  mag: Uint8Array,
  width: number,
  height: number,
  threshold: number,
): EdgeMap {
  const len = mag.length;
  const data = new Uint8Array(len);

  // Use loop unrolling for better performance
  const len4 = len & ~3;
  for (let i = 0; i < len4; i += 4) {
    data[i] = mag[i]! >= threshold ? 1 : 0;
    data[i + 1] = mag[i + 1]! >= threshold ? 1 : 0;
    data[i + 2] = mag[i + 2]! >= threshold ? 1 : 0;
    data[i + 3] = mag[i + 3]! >= threshold ? 1 : 0;
  }
  // Handle remainder
  for (let i = len4; i < len; i++) {
    data[i] = mag[i]! >= threshold ? 1 : 0;
  }

  return { width, height, data };
}
