/**
 * Noise Reduction Algorithms
 * Implements various noise reduction techniques for image enhancement
 */

export type NoiseReductionLevel = "none" | "light" | "medium" | "heavy" | "auto";

export interface NoiseReductionOptions {
  level: NoiseReductionLevel;
  preserveDetails: boolean;
  luminanceOnly: boolean;
  spatialSigma: number;
  colorSigma: number;
}

export interface NoiseAnalysis {
  estimatedNoise: number; // 0-1
  signalToNoiseRatio: number;
  recommendedLevel: NoiseReductionLevel;
  regions: NoiseRegion[];
}

export interface NoiseRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  noiseLevel: number;
}

const DEFAULT_OPTIONS: NoiseReductionOptions = {
  level: "auto",
  preserveDetails: true,
  luminanceOnly: false,
  spatialSigma: 3,
  colorSigma: 25,
};

/**
 * Analyze image noise levels
 */
export function analyzeNoise(imageData: ImageData): NoiseAnalysis {
  const { data, width, height } = imageData;
  const blockSize = 16;
  const regions: NoiseRegion[] = [];
  let totalNoise = 0;
  let blockCount = 0;

  // Analyze noise in blocks
  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      const variance = calculateBlockVariance(data, width, x, y, blockSize);
      const noiseLevel = Math.min(1, variance / 2500);

      regions.push({ x, y, width: blockSize, height: blockSize, noiseLevel });
      totalNoise += noiseLevel;
      blockCount++;
    }
  }

  const estimatedNoise = blockCount > 0 ? totalNoise / blockCount : 0;
  const signalToNoiseRatio = estimatedNoise > 0 ? 1 / estimatedNoise : 100;

  return {
    estimatedNoise,
    signalToNoiseRatio,
    recommendedLevel: getRecommendedLevel(estimatedNoise),
    regions,
  };
}

function calculateBlockVariance(
  data: Uint8ClampedArray,
  width: number,
  startX: number,
  startY: number,
  blockSize: number,
): number {
  const pixels: number[] = [];

  for (let y = startY; y < startY + blockSize; y++) {
    for (let x = startX; x < startX + blockSize; x++) {
      const idx = (y * width + x) * 4;
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      pixels.push(luminance);
    }
  }

  const mean = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  const variance = pixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixels.length;

  return variance;
}

function getRecommendedLevel(noise: number): NoiseReductionLevel {
  if (noise < 0.1) return "none";
  if (noise < 0.25) return "light";
  if (noise < 0.5) return "medium";
  return "heavy";
}

/**
 * Apply Gaussian blur for basic noise reduction
 */
function applyGaussianBlur(imageData: ImageData, sigma: number): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
  const kernel = generateGaussianKernel(kernelSize, sigma);
  const halfKernel = Math.floor(kernelSize / 2);

  // Horizontal pass
  const temp = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        weightSum = 0;

      for (let kx = -halfKernel; kx <= halfKernel; kx++) {
        const px = Math.min(width - 1, Math.max(0, x + kx));
        const idx = (y * width + px) * 4;
        const weight = kernel[kx + halfKernel];

        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        a += data[idx + 3] * weight;
        weightSum += weight;
      }

      const outIdx = (y * width + x) * 4;
      temp[outIdx] = r / weightSum;
      temp[outIdx + 1] = g / weightSum;
      temp[outIdx + 2] = b / weightSum;
      temp[outIdx + 3] = a / weightSum;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        weightSum = 0;

      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        const py = Math.min(height - 1, Math.max(0, y + ky));
        const idx = (py * width + x) * 4;
        const weight = kernel[ky + halfKernel];

        r += temp[idx] * weight;
        g += temp[idx + 1] * weight;
        b += temp[idx + 2] * weight;
        a += temp[idx + 3] * weight;
        weightSum += weight;
      }

      const outIdx = (y * width + x) * 4;
      result[outIdx] = r / weightSum;
      result[outIdx + 1] = g / weightSum;
      result[outIdx + 2] = b / weightSum;
      result[outIdx + 3] = a / weightSum;
    }
  }

  return new ImageData(result, width, height);
}

function generateGaussianKernel(size: number, sigma: number): number[] {
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
 * Apply bilateral filter for edge-preserving noise reduction
 */
export function applyBilateralFilter(
  imageData: ImageData,
  spatialSigma: number,
  colorSigma: number,
): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const kernelSize = Math.ceil(spatialSigma * 2) * 2 + 1;
  const halfKernel = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const centerIdx = (y * width + x) * 4;
      const centerR = data[centerIdx];
      const centerG = data[centerIdx + 1];
      const centerB = data[centerIdx + 2];

      let sumR = 0,
        sumG = 0,
        sumB = 0,
        weightSum = 0;

      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const idx = (py * width + px) * 4;

          const spatialDist = Math.sqrt(kx * kx + ky * ky);
          const colorDist = Math.sqrt(
            Math.pow(data[idx] - centerR, 2) +
              Math.pow(data[idx + 1] - centerG, 2) +
              Math.pow(data[idx + 2] - centerB, 2),
          );

          const spatialWeight = Math.exp(
            -(spatialDist * spatialDist) / (2 * spatialSigma * spatialSigma),
          );
          const colorWeight = Math.exp(-(colorDist * colorDist) / (2 * colorSigma * colorSigma));
          const weight = spatialWeight * colorWeight;

          sumR += data[idx] * weight;
          sumG += data[idx + 1] * weight;
          sumB += data[idx + 2] * weight;
          weightSum += weight;
        }
      }

      result[centerIdx] = sumR / weightSum;
      result[centerIdx + 1] = sumG / weightSum;
      result[centerIdx + 2] = sumB / weightSum;
      result[centerIdx + 3] = data[centerIdx + 3];
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Apply median filter for impulse noise reduction
 */
export function applyMedianFilter(imageData: ImageData, kernelSize: number = 3): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const halfKernel = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rValues: number[] = [];
      const gValues: number[] = [];
      const bValues: number[] = [];

      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const idx = (py * width + px) * 4;

          rValues.push(data[idx]);
          gValues.push(data[idx + 1]);
          bValues.push(data[idx + 2]);
        }
      }

      rValues.sort((a, b) => a - b);
      gValues.sort((a, b) => a - b);
      bValues.sort((a, b) => a - b);

      const mid = Math.floor(rValues.length / 2);
      const outIdx = (y * width + x) * 4;

      result[outIdx] = rValues[mid];
      result[outIdx + 1] = gValues[mid];
      result[outIdx + 2] = bValues[mid];
      result[outIdx + 3] = data[outIdx + 3];
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Main noise reduction function
 */
export function reduceNoise(
  imageData: ImageData,
  options: Partial<NoiseReductionOptions> = {},
): ImageData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let level = opts.level;

  // Auto-detect noise level
  if (level === "auto") {
    const analysis = analyzeNoise(imageData);
    level = analysis.recommendedLevel;
  }

  if (level === "none") {
    return imageData;
  }

  // Apply appropriate filter based on level
  const params = getFilterParams(level);

  if (opts.preserveDetails) {
    return applyBilateralFilter(imageData, params.spatial, params.color);
  } else {
    return applyGaussianBlur(imageData, params.spatial);
  }
}

function getFilterParams(level: NoiseReductionLevel): { spatial: number; color: number } {
  switch (level) {
    case "light":
      return { spatial: 2, color: 15 };
    case "medium":
      return { spatial: 3, color: 25 };
    case "heavy":
      return { spatial: 5, color: 40 };
    default:
      return { spatial: 3, color: 25 };
  }
}
