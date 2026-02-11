/**
 * Sharpening Filters
 * Implements various image sharpening techniques
 */

export type SharpeningMethod = "unsharp" | "laplacian" | "highpass" | "adaptive";

export interface SharpeningOptions {
  method: SharpeningMethod;
  intensity: number; // 0-100
  radius: number;
  threshold: number; // Edge threshold for adaptive sharpening
  preserveHighlights: boolean;
  preserveShadows: boolean;
}

export interface SharpeningAnalysis {
  currentSharpness: number; // 0-100
  recommendedIntensity: number;
  edgeDensity: number;
  blurEstimate: number;
}

const DEFAULT_OPTIONS: SharpeningOptions = {
  method: "unsharp",
  intensity: 50,
  radius: 1,
  threshold: 0,
  preserveHighlights: true,
  preserveShadows: true,
};

// Kernels for various sharpening methods
const LAPLACIAN_KERNEL = [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0],
];

const HIGHPASS_KERNEL = [
  [-1, -1, -1],
  [-1, 9, -1],
  [-1, -1, -1],
];

/**
 * Analyze image sharpness
 */
export function analyzeSharpness(imageData: ImageData): SharpeningAnalysis {
  const { data, width, height } = imageData;
  let edgeSum = 0;
  let edgeCount = 0;

  // Calculate Laplacian variance for sharpness estimation
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

      // Get neighboring pixels
      const top = data[((y - 1) * width + x) * 4];
      const bottom = data[((y + 1) * width + x) * 4];
      const left = data[(y * width + (x - 1)) * 4];
      const right = data[(y * width + (x + 1)) * 4];

      const laplacian = Math.abs(4 * luminance - top - bottom - left - right);
      edgeSum += laplacian;
      edgeCount++;
    }
  }

  const avgEdge = edgeCount > 0 ? edgeSum / edgeCount : 0;
  const currentSharpness = Math.min(100, avgEdge / 2.55);
  const blurEstimate = Math.max(0, 100 - currentSharpness);

  return {
    currentSharpness,
    recommendedIntensity: Math.min(100, Math.max(0, 75 - currentSharpness)),
    edgeDensity: avgEdge / 255,
    blurEstimate,
  };
}

/**
 * Apply convolution kernel to image
 */
function applyKernel(imageData: ImageData, kernel: number[][]): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const kSize = kernel.length;
  const kHalf = Math.floor(kSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const py = Math.min(height - 1, Math.max(0, y + ky - kHalf));
          const px = Math.min(width - 1, Math.max(0, x + kx - kHalf));
          const idx = (py * width + px) * 4;
          const weight = kernel[ky][kx];

          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
        }
      }

      const outIdx = (y * width + x) * 4;
      result[outIdx] = Math.min(255, Math.max(0, r));
      result[outIdx + 1] = Math.min(255, Math.max(0, g));
      result[outIdx + 2] = Math.min(255, Math.max(0, b));
      result[outIdx + 3] = data[outIdx + 3];
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Apply unsharp mask sharpening
 */
function applyUnsharpMask(
  imageData: ImageData,
  amount: number,
  radius: number,
  threshold: number,
): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);

  // Create blurred version
  const blurred = applyGaussianBlur(imageData, radius);

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const original = data[i + c];
      const blur = blurred.data[i + c];
      const diff = original - blur;

      if (Math.abs(diff) > threshold) {
        result[i + c] = Math.min(255, Math.max(0, original + diff * amount));
      } else {
        result[i + c] = original;
      }
    }
    result[i + 3] = data[i + 3];
  }

  return new ImageData(result, width, height);
}

function applyGaussianBlur(imageData: ImageData, sigma: number): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
  const kernel = generateGaussianKernel1D(kernelSize, sigma);
  const halfKernel = Math.floor(kernelSize / 2);

  // Horizontal pass
  const temp = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        weightSum = 0;

      for (let kx = -halfKernel; kx <= halfKernel; kx++) {
        const px = Math.min(width - 1, Math.max(0, x + kx));
        const idx = (y * width + px) * 4;
        const weight = kernel[kx + halfKernel];

        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        weightSum += weight;
      }

      const outIdx = (y * width + x) * 4;
      temp[outIdx] = r / weightSum;
      temp[outIdx + 1] = g / weightSum;
      temp[outIdx + 2] = b / weightSum;
      temp[outIdx + 3] = data[outIdx + 3];
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        weightSum = 0;

      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        const py = Math.min(height - 1, Math.max(0, y + ky));
        const idx = (py * width + x) * 4;
        const weight = kernel[ky + halfKernel];

        r += temp[idx] * weight;
        g += temp[idx + 1] * weight;
        b += temp[idx + 2] * weight;
        weightSum += weight;
      }

      const outIdx = (y * width + x) * 4;
      result[outIdx] = r / weightSum;
      result[outIdx + 1] = g / weightSum;
      result[outIdx + 2] = b / weightSum;
      result[outIdx + 3] = temp[outIdx + 3];
    }
  }

  return new ImageData(result, width, height);
}

function generateGaussianKernel1D(size: number, sigma: number): number[] {
  const kernel: number[] = [];
  const center = Math.floor(size / 2);
  let sum = 0;

  for (let i = 0; i < size; i++) {
    const x = i - center;
    const value = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(value);
    sum += value;
  }

  return kernel.map(v => v / sum);
}

/**
 * Apply adaptive sharpening based on local content
 */
function applyAdaptiveSharpening(
  imageData: ImageData,
  intensity: number,
  threshold: number,
): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Calculate local variance
      const neighbors: number[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          const lum = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
          neighbors.push(lum);
        }
      }

      const mean = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
      const variance =
        neighbors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / neighbors.length;

      // Adaptive sharpening amount based on local variance
      const adaptiveAmount = variance > threshold ? intensity / 100 : intensity / 200;

      for (let c = 0; c < 3; c++) {
        const center = data[idx + c];
        const avg =
          (data[((y - 1) * width + x) * 4 + c] +
            data[((y + 1) * width + x) * 4 + c] +
            data[(y * width + (x - 1)) * 4 + c] +
            data[(y * width + (x + 1)) * 4 + c]) /
          4;

        const sharpened = center + (center - avg) * adaptiveAmount;
        result[idx + c] = Math.min(255, Math.max(0, sharpened));
      }
      result[idx + 3] = data[idx + 3];
    }
  }

  // Copy border pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        const idx = (y * width + x) * 4;
        result[idx] = data[idx];
        result[idx + 1] = data[idx + 1];
        result[idx + 2] = data[idx + 2];
        result[idx + 3] = data[idx + 3];
      }
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Apply highlight/shadow preservation
 */
function preserveTones(
  original: ImageData,
  sharpened: ImageData,
  preserveHighlights: boolean,
  preserveShadows: boolean,
): ImageData {
  const result = new Uint8ClampedArray(sharpened.data.length);

  for (let i = 0; i < original.data.length; i += 4) {
    const origLum =
      0.299 * original.data[i] + 0.587 * original.data[i + 1] + 0.114 * original.data[i + 2];

    let blendFactor = 1;
    if (preserveHighlights && origLum > 200) {
      blendFactor = Math.max(0, 1 - (origLum - 200) / 55);
    }
    if (preserveShadows && origLum < 50) {
      blendFactor = Math.min(blendFactor, origLum / 50);
    }

    for (let c = 0; c < 3; c++) {
      result[i + c] =
        original.data[i + c] * (1 - blendFactor) + sharpened.data[i + c] * blendFactor;
    }
    result[i + 3] = original.data[i + 3];
  }

  return new ImageData(result, original.width, original.height);
}

/**
 * Main sharpening function
 */
export function sharpenImage(
  imageData: ImageData,
  options: Partial<SharpeningOptions> = {},
): ImageData {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.intensity === 0) {
    return imageData;
  }

  let result: ImageData;
  const normalizedIntensity = opts.intensity / 100;

  switch (opts.method) {
    case "laplacian":
      result = applyKernel(imageData, LAPLACIAN_KERNEL);
      // Blend based on intensity
      result = blendImages(imageData, result, normalizedIntensity);
      break;

    case "highpass":
      result = applyKernel(imageData, HIGHPASS_KERNEL);
      result = blendImages(imageData, result, normalizedIntensity);
      break;

    case "adaptive":
      result = applyAdaptiveSharpening(imageData, opts.intensity, opts.threshold);
      break;

    case "unsharp":
    default:
      result = applyUnsharpMask(imageData, normalizedIntensity, opts.radius, opts.threshold);
      break;
  }

  if (opts.preserveHighlights || opts.preserveShadows) {
    result = preserveTones(imageData, result, opts.preserveHighlights, opts.preserveShadows);
  }

  return result;
}

function blendImages(img1: ImageData, img2: ImageData, factor: number): ImageData {
  const result = new Uint8ClampedArray(img1.data.length);

  for (let i = 0; i < img1.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      result[i + c] = img1.data[i + c] * (1 - factor) + img2.data[i + c] * factor;
    }
    result[i + 3] = img1.data[i + 3];
  }

  return new ImageData(result, img1.width, img1.height);
}
