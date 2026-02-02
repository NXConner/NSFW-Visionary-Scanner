import { canvasToImageData, decodeDataUrlToImageBitmap, resizeToMax } from "@/scanner/utils/image";

export interface PreprocessResult {
  imageData: ImageData;
  /** Downscale factor relative to original bitmap. */
  scale: number;
}

export async function preprocessImageDataUrl(
  imageDataUrl: string,
  opts: { maxDim?: number } = {},
): Promise<PreprocessResult> {
  const bitmap = await decodeDataUrlToImageBitmap(imageDataUrl);
  return await preprocessImageBitmap(bitmap, opts);
}

export async function preprocessImageBitmap(
  bitmap: ImageBitmap,
  opts: { maxDim?: number } = {},
): Promise<PreprocessResult> {
  const { canvas, scale } = await resizeToMax(
    bitmap,
    Math.max(480, Math.min(2048, opts.maxDim ?? 1024)),
  );
  const imageData = canvasToImageData(canvas);
  return { imageData, scale };
}

/**
 * Optimized grayscale conversion using integer math.
 * Uses fixed-point arithmetic for speed (avoid floating point).
 */
export function toGrayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const len = width * height;
  const out = new Uint8Array(len);
  
  // Use integer coefficients scaled by 256 for fixed-point math
  // 0.2126 * 256 ≈ 54, 0.7152 * 256 ≈ 183, 0.0722 * 256 ≈ 18
  // Sum = 255, close enough to 256 for our purposes
  
  const dataLen = data.length;
  const len4 = dataLen & ~15; // Process 4 pixels at a time (16 bytes)
  
  let p = 0;
  for (let i = 0; i < len4; i += 16) {
    // Pixel 1
    out[p++] = ((data[i]! * 54 + data[i + 1]! * 183 + data[i + 2]! * 18) >> 8);
    // Pixel 2
    out[p++] = ((data[i + 4]! * 54 + data[i + 5]! * 183 + data[i + 6]! * 18) >> 8);
    // Pixel 3
    out[p++] = ((data[i + 8]! * 54 + data[i + 9]! * 183 + data[i + 10]! * 18) >> 8);
    // Pixel 4
    out[p++] = ((data[i + 12]! * 54 + data[i + 13]! * 183 + data[i + 14]! * 18) >> 8);
  }
  
  // Handle remainder
  for (let i = len4; i < dataLen; i += 4) {
    out[p++] = ((data[i]! * 54 + data[i + 1]! * 183 + data[i + 2]! * 18) >> 8);
  }
  
  return out;
}
