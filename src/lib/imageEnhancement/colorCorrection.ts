/**
 * Color and Exposure Correction
 * Implements color balance, exposure, and tone adjustments
 */

export interface ColorCorrectionOptions {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  exposure: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  whites: number; // -100 to 100
  blacks: number; // -100 to 100
  temperature: number; // -100 (cool) to 100 (warm)
  tint: number; // -100 (green) to 100 (magenta)
  saturation: number; // -100 to 100
  vibrance: number; // -100 to 100
}

export interface ColorAnalysis {
  averageBrightness: number; // 0-255
  contrast: number; // 0-100
  histogram: { r: number[]; g: number[]; b: number[]; luminance: number[] };
  colorTemperature: number; // Kelvin estimate
  dominantColors: Array<{ r: number; g: number; b: number; percentage: number }>;
  isOverexposed: boolean;
  isUnderexposed: boolean;
  recommendedAdjustments: Partial<ColorCorrectionOptions>;
}

const DEFAULT_OPTIONS: ColorCorrectionOptions = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  saturation: 0,
  vibrance: 0,
};

/**
 * Analyze image color properties
 */
export function analyzeColors(imageData: ImageData): ColorAnalysis {
  const { data, width, height } = imageData;
  const histogram = {
    r: new Array(256).fill(0),
    g: new Array(256).fill(0),
    b: new Array(256).fill(0),
    luminance: new Array(256).fill(0),
  };

  let totalBrightness = 0;
  const colorCounts: Map<string, number> = new Map();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    histogram.r[r]++;
    histogram.g[g]++;
    histogram.b[b]++;
    histogram.luminance[lum]++;

    totalBrightness += lum;

    // Quantize for dominant color detection
    const qr = Math.floor(r / 32) * 32;
    const qg = Math.floor(g / 32) * 32;
    const qb = Math.floor(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
  }

  const pixelCount = data.length / 4;
  const averageBrightness = totalBrightness / pixelCount;

  // Calculate contrast using histogram spread
  let minLum = 255, maxLum = 0;
  for (let i = 0; i < 256; i++) {
    if (histogram.luminance[i] > 0) {
      minLum = Math.min(minLum, i);
      maxLum = Math.max(maxLum, i);
    }
  }
  const contrast = ((maxLum - minLum) / 255) * 100;

  // Estimate color temperature from RGB ratios
  let totalR = 0, totalB = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalB += data[i + 2];
  }
  const rbRatio = totalR / totalB;
  const colorTemperature = Math.round(6500 * rbRatio); // Rough estimation

  // Get dominant colors
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number);
      return { r, g, b, percentage: (count / pixelCount) * 100 };
    });

  // Check exposure
  const darkPixels = histogram.luminance.slice(0, 30).reduce((a, b) => a + b, 0);
  const brightPixels = histogram.luminance.slice(225).reduce((a, b) => a + b, 0);
  const isUnderexposed = darkPixels / pixelCount > 0.3;
  const isOverexposed = brightPixels / pixelCount > 0.3;

  // Generate recommendations
  const recommendedAdjustments: Partial<ColorCorrectionOptions> = {};
  if (averageBrightness < 100) {
    recommendedAdjustments.brightness = Math.round((128 - averageBrightness) * 0.5);
    recommendedAdjustments.exposure = Math.round((128 - averageBrightness) * 0.3);
  } else if (averageBrightness > 180) {
    recommendedAdjustments.brightness = Math.round((128 - averageBrightness) * 0.3);
  }
  if (contrast < 40) {
    recommendedAdjustments.contrast = Math.round((50 - contrast) * 0.8);
  }

  return {
    averageBrightness,
    contrast,
    histogram,
    colorTemperature,
    dominantColors: sortedColors,
    isOverexposed,
    isUnderexposed,
    recommendedAdjustments,
  };
}

/**
 * Apply brightness adjustment
 */
function applyBrightness(data: Uint8ClampedArray, amount: number): void {
  const adjustment = (amount / 100) * 255;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + adjustment));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment));
  }
}

/**
 * Apply contrast adjustment
 */
function applyContrast(data: Uint8ClampedArray, amount: number): void {
  const factor = (259 * (amount + 255)) / (255 * (259 - amount));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
  }
}

/**
 * Apply exposure adjustment (gamma correction)
 */
function applyExposure(data: Uint8ClampedArray, amount: number): void {
  const gamma = 1 + (amount / 100);
  const gammaCorrection = 1 / gamma;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(255 * Math.pow(data[i] / 255, gammaCorrection));
    data[i + 1] = Math.round(255 * Math.pow(data[i + 1] / 255, gammaCorrection));
    data[i + 2] = Math.round(255 * Math.pow(data[i + 2] / 255, gammaCorrection));
  }
}

/**
 * Apply highlights adjustment
 */
function applyHighlights(data: Uint8ClampedArray, amount: number): void {
  const adjustment = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum > 180) {
      const factor = (lum - 180) / 75;
      const adjust = adjustment * factor * 50;
      data[i] = Math.min(255, Math.max(0, data[i] + adjust));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjust));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjust));
    }
  }
}

/**
 * Apply shadows adjustment
 */
function applyShadows(data: Uint8ClampedArray, amount: number): void {
  const adjustment = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < 75) {
      const factor = 1 - (lum / 75);
      const adjust = adjustment * factor * 50;
      data[i] = Math.min(255, Math.max(0, data[i] + adjust));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjust));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjust));
    }
  }
}

/**
 * Apply color temperature adjustment (white balance)
 */
function applyTemperature(data: Uint8ClampedArray, amount: number): void {
  const adjustment = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    // Warm = more red/yellow, Cool = more blue
    data[i] = Math.min(255, Math.max(0, data[i] + adjustment * 30)); // Red
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - adjustment * 30)); // Blue
  }
}

/**
 * Apply tint adjustment
 */
function applyTint(data: Uint8ClampedArray, amount: number): void {
  const adjustment = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    // Positive = magenta, Negative = green
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] - adjustment * 20)); // Green
  }
}

/**
 * RGB to HSL conversion
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
}

/**
 * HSL to RGB conversion
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Apply saturation adjustment
 */
function applySaturation(data: Uint8ClampedArray, amount: number): void {
  const adjustment = 1 + (amount / 100);
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const newS = Math.min(1, Math.max(0, s * adjustment));
    const [r, g, b] = hslToRgb(h, newS, l);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

/**
 * Apply vibrance adjustment (smart saturation)
 */
function applyVibrance(data: Uint8ClampedArray, amount: number): void {
  const adjustment = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    // Vibrance affects less saturated colors more
    const vibranceAmount = adjustment * (1 - s);
    const newS = Math.min(1, Math.max(0, s + vibranceAmount * 0.5));
    const [r, g, b] = hslToRgb(h, newS, l);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

/**
 * Apply whites adjustment
 */
function applyWhites(data: Uint8ClampedArray, amount: number): void {
  const adjustment = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum > 220) {
      const factor = (lum - 220) / 35;
      const adjust = adjustment * factor * 30;
      data[i] = Math.min(255, Math.max(0, data[i] + adjust));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjust));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjust));
    }
  }
}

/**
 * Apply blacks adjustment
 */
function applyBlacks(data: Uint8ClampedArray, amount: number): void {
  const adjustment = amount / 100;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < 35) {
      const factor = 1 - (lum / 35);
      const adjust = adjustment * factor * 30;
      data[i] = Math.min(255, Math.max(0, data[i] - adjust));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] - adjust));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - adjust));
    }
  }
}

/**
 * Main color correction function
 */
export function correctColors(
  imageData: ImageData,
  options: Partial<ColorCorrectionOptions> = {}
): ImageData {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result = new Uint8ClampedArray(imageData.data);

  // Apply adjustments in optimal order
  if (opts.exposure !== 0) applyExposure(result, opts.exposure);
  if (opts.brightness !== 0) applyBrightness(result, opts.brightness);
  if (opts.contrast !== 0) applyContrast(result, opts.contrast);
  if (opts.highlights !== 0) applyHighlights(result, opts.highlights);
  if (opts.shadows !== 0) applyShadows(result, opts.shadows);
  if (opts.whites !== 0) applyWhites(result, opts.whites);
  if (opts.blacks !== 0) applyBlacks(result, opts.blacks);
  if (opts.temperature !== 0) applyTemperature(result, opts.temperature);
  if (opts.tint !== 0) applyTint(result, opts.tint);
  if (opts.saturation !== 0) applySaturation(result, opts.saturation);
  if (opts.vibrance !== 0) applyVibrance(result, opts.vibrance);

  return new ImageData(result, imageData.width, imageData.height);
}

/**
 * Auto white balance
 */
export function autoWhiteBalance(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);

  // Calculate average RGB values
  let avgR = 0, avgG = 0, avgB = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    avgR += data[i];
    avgG += data[i + 1];
    avgB += data[i + 2];
  }

  avgR /= pixelCount;
  avgG /= pixelCount;
  avgB /= pixelCount;

  // Calculate gray average
  const grayAvg = (avgR + avgG + avgB) / 3;

  // Calculate scaling factors
  const scaleR = grayAvg / avgR;
  const scaleG = grayAvg / avgG;
  const scaleB = grayAvg / avgB;

  // Apply white balance
  for (let i = 0; i < result.length; i += 4) {
    result[i] = Math.min(255, Math.max(0, result[i] * scaleR));
    result[i + 1] = Math.min(255, Math.max(0, result[i + 1] * scaleG));
    result[i + 2] = Math.min(255, Math.max(0, result[i + 2] * scaleB));
  }

  return new ImageData(result, width, height);
}
