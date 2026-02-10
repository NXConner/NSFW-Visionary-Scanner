/**
 * Auto-Enhancement with ML-based Adjustments
 * Intelligent image analysis and enhancement algorithms
 */

import { analyzeNoise, reduceNoise, type NoiseReductionLevel } from './noiseReduction';
import { analyzeSharpness, sharpenImage } from './sharpening';
import { analyzeColors, correctColors, autoWhiteBalance, type ColorCorrectionOptions } from './colorCorrection';

export type EnhancementPreset = 'auto' | 'portrait' | 'medical' | 'detailed' | 'natural' | 'vivid';

export interface AutoEnhanceOptions {
  preset: EnhancementPreset;
  intensity: number; // 0-100, how aggressive the enhancement should be
  preserveOriginal: boolean; // Blend with original based on intensity
  enableNoiseReduction: boolean;
  enableSharpening: boolean;
  enableColorCorrection: boolean;
  enableWhiteBalance: boolean;
}

export interface EnhancementResult {
  enhancedImage: ImageData;
  analysis: ImageAnalysis;
  appliedAdjustments: AppliedAdjustments;
  qualityScore: QualityScore;
  processingTime: number;
}

export interface ImageAnalysis {
  noise: {
    level: number;
    recommendation: NoiseReductionLevel;
  };
  sharpness: {
    current: number;
    recommended: number;
  };
  exposure: {
    brightness: number;
    isOverexposed: boolean;
    isUnderexposed: boolean;
  };
  color: {
    temperature: number;
    saturation: number;
    contrast: number;
  };
  overall: {
    quality: number;
    category: 'poor' | 'fair' | 'good' | 'excellent';
  };
}

export interface AppliedAdjustments {
  noiseReduction: NoiseReductionLevel | null;
  sharpening: number | null;
  colorCorrection: Partial<ColorCorrectionOptions> | null;
  whiteBalance: boolean;
}

export interface QualityScore {
  before: number;
  after: number;
  improvement: number;
}

const DEFAULT_OPTIONS: AutoEnhanceOptions = {
  preset: 'auto',
  intensity: 50,
  preserveOriginal: true,
  enableNoiseReduction: true,
  enableSharpening: true,
  enableColorCorrection: true,
  enableWhiteBalance: true,
};

/**
 * Analyze image quality and characteristics
 */
export function analyzeImage(imageData: ImageData): ImageAnalysis {
  const noiseAnalysis = analyzeNoise(imageData);
  const sharpnessAnalysis = analyzeSharpness(imageData);
  const colorAnalysis = analyzeColors(imageData);

  // Calculate overall quality score
  const noiseScore = 100 - (noiseAnalysis.estimatedNoise * 100);
  const sharpnessScore = sharpnessAnalysis.currentSharpness;
  const exposureScore = calculateExposureScore(colorAnalysis.averageBrightness);
  const colorScore = Math.min(100, colorAnalysis.contrast + 20);

  const overallScore = (
    noiseScore * 0.25 +
    sharpnessScore * 0.3 +
    exposureScore * 0.25 +
    colorScore * 0.2
  );

  return {
    noise: {
      level: noiseAnalysis.estimatedNoise,
      recommendation: noiseAnalysis.recommendedLevel,
    },
    sharpness: {
      current: sharpnessAnalysis.currentSharpness,
      recommended: sharpnessAnalysis.recommendedIntensity,
    },
    exposure: {
      brightness: colorAnalysis.averageBrightness,
      isOverexposed: colorAnalysis.isOverexposed,
      isUnderexposed: colorAnalysis.isUnderexposed,
    },
    color: {
      temperature: colorAnalysis.colorTemperature,
      saturation: 50, // Default estimate
      contrast: colorAnalysis.contrast,
    },
    overall: {
      quality: overallScore,
      category: getQualityCategory(overallScore),
    },
  };
}

function calculateExposureScore(brightness: number): number {
  // Optimal brightness is around 128 (middle gray)
  const deviation = Math.abs(brightness - 128);
  return Math.max(0, 100 - (deviation / 128) * 100);
}

function getQualityCategory(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Get preset-specific enhancement parameters
 */
function getPresetParameters(preset: EnhancementPreset, analysis: ImageAnalysis): {
  noiseReduction: NoiseReductionLevel;
  sharpening: number;
  colorCorrection: Partial<ColorCorrectionOptions>;
} {
  const baseParams = {
    noiseReduction: analysis.noise.recommendation,
    sharpening: analysis.sharpness.recommended,
    colorCorrection: {} as Partial<ColorCorrectionOptions>,
  };

  switch (preset) {
    case 'portrait':
      return {
        noiseReduction: 'medium',
        sharpening: Math.min(40, analysis.sharpness.recommended),
        colorCorrection: {
          brightness: analysis.exposure.isUnderexposed ? 15 : 0,
          contrast: 10,
          saturation: 5,
          vibrance: 15,
        },
      };

    case 'medical':
      return {
        noiseReduction: analysis.noise.recommendation,
        sharpening: Math.min(60, analysis.sharpness.recommended + 10),
        colorCorrection: {
          brightness: calculateBrightnessAdjustment(analysis.exposure.brightness),
          contrast: 20,
          saturation: 0,
          vibrance: 0,
        },
      };

    case 'detailed':
      return {
        noiseReduction: 'light',
        sharpening: Math.min(80, analysis.sharpness.recommended + 20),
        colorCorrection: {
          brightness: calculateBrightnessAdjustment(analysis.exposure.brightness),
          contrast: 25,
          highlights: -10,
          shadows: 15,
        },
      };

    case 'natural':
      return {
        noiseReduction: analysis.noise.recommendation,
        sharpening: Math.min(30, analysis.sharpness.recommended * 0.5),
        colorCorrection: {
          brightness: calculateBrightnessAdjustment(analysis.exposure.brightness) * 0.5,
          contrast: Math.max(0, (50 - analysis.color.contrast) * 0.3),
        },
      };

    case 'vivid':
      return {
        noiseReduction: analysis.noise.recommendation,
        sharpening: analysis.sharpness.recommended,
        colorCorrection: {
          brightness: calculateBrightnessAdjustment(analysis.exposure.brightness),
          contrast: 20,
          saturation: 20,
          vibrance: 25,
          highlights: -15,
          shadows: 20,
        },
      };

    case 'auto':
    default:
      return {
        noiseReduction: analysis.noise.recommendation,
        sharpening: analysis.sharpness.recommended,
        colorCorrection: {
          brightness: calculateBrightnessAdjustment(analysis.exposure.brightness),
          contrast: Math.max(0, (50 - analysis.color.contrast) * 0.5),
          saturation: 0,
          vibrance: 10,
        },
      };
  }
}

function calculateBrightnessAdjustment(currentBrightness: number): number {
  const targetBrightness = 128;
  const difference = targetBrightness - currentBrightness;
  return Math.round(difference * 0.3);
}

/**
 * Blend two images based on opacity
 */
function blendImages(original: ImageData, enhanced: ImageData, opacity: number): ImageData {
  const result = new Uint8ClampedArray(original.data.length);
  
  for (let i = 0; i < original.data.length; i += 4) {
    result[i] = original.data[i] * (1 - opacity) + enhanced.data[i] * opacity;
    result[i + 1] = original.data[i + 1] * (1 - opacity) + enhanced.data[i + 1] * opacity;
    result[i + 2] = original.data[i + 2] * (1 - opacity) + enhanced.data[i + 2] * opacity;
    result[i + 3] = original.data[i + 3];
  }

  return new ImageData(result, original.width, original.height);
}

/**
 * Calculate image quality score
 */
function calculateQualityScore(imageData: ImageData): number {
  const analysis = analyzeImage(imageData);
  return analysis.overall.quality;
}

/**
 * Main auto-enhance function
 */
export function autoEnhance(
  imageData: ImageData,
  options: Partial<AutoEnhanceOptions> = {}
): EnhancementResult {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Analyze the original image
  const analysis = analyzeImage(imageData);
  const beforeScore = analysis.overall.quality;

  // Get enhancement parameters based on preset
  const params = getPresetParameters(opts.preset, analysis);

  // Apply intensity scaling
  const intensityFactor = opts.intensity / 100;

  // Track applied adjustments
  const appliedAdjustments: AppliedAdjustments = {
    noiseReduction: null,
    sharpening: null,
    colorCorrection: null,
    whiteBalance: false,
  };

  let result = imageData;

  // Apply noise reduction
  if (opts.enableNoiseReduction && params.noiseReduction !== 'none') {
    result = reduceNoise(result, {
      level: params.noiseReduction,
      preserveDetails: true,
    });
    appliedAdjustments.noiseReduction = params.noiseReduction;
  }

  // Apply white balance
  if (opts.enableWhiteBalance) {
    result = autoWhiteBalance(result);
    appliedAdjustments.whiteBalance = true;
  }

  // Apply color correction
  if (opts.enableColorCorrection && Object.keys(params.colorCorrection).length > 0) {
    // Scale adjustments by intensity
    const scaledCorrection: Partial<ColorCorrectionOptions> = {};
    for (const [key, value] of Object.entries(params.colorCorrection)) {
      if (typeof value === 'number') {
        scaledCorrection[key as keyof ColorCorrectionOptions] = value * intensityFactor;
      }
    }
    result = correctColors(result, scaledCorrection);
    appliedAdjustments.colorCorrection = scaledCorrection;
  }

  // Apply sharpening
  if (opts.enableSharpening && params.sharpening > 0) {
    const scaledSharpening = params.sharpening * intensityFactor;
    result = sharpenImage(result, {
      intensity: scaledSharpening,
      method: 'unsharp',
      preserveHighlights: true,
      preserveShadows: true,
    });
    appliedAdjustments.sharpening = scaledSharpening;
  }

  // Blend with original if preserveOriginal is enabled
  if (opts.preserveOriginal && opts.intensity < 100) {
    result = blendImages(imageData, result, intensityFactor);
  }

  // Calculate quality improvement
  const afterScore = calculateQualityScore(result);

  const processingTime = performance.now() - startTime;

  return {
    enhancedImage: result,
    analysis,
    appliedAdjustments,
    qualityScore: {
      before: beforeScore,
      after: afterScore,
      improvement: afterScore - beforeScore,
    },
    processingTime,
  };
}

/**
 * Quick enhance with default settings
 */
export function quickEnhance(imageData: ImageData): ImageData {
  return autoEnhance(imageData, { preset: 'auto', intensity: 50 }).enhancedImage;
}

/**
 * Get enhancement suggestions without applying
 */
export function getEnhancementSuggestions(imageData: ImageData): {
  analysis: ImageAnalysis;
  suggestions: string[];
  recommendedPreset: EnhancementPreset;
} {
  const analysis = analyzeImage(imageData);
  const suggestions: string[] = [];

  if (analysis.noise.level > 0.2) {
    suggestions.push(`Apply ${analysis.noise.recommendation} noise reduction`);
  }

  if (analysis.sharpness.current < 50) {
    suggestions.push(`Increase sharpness by ${analysis.sharpness.recommended}%`);
  }

  if (analysis.exposure.isUnderexposed) {
    suggestions.push('Increase brightness and exposure');
  } else if (analysis.exposure.isOverexposed) {
    suggestions.push('Reduce highlights and overall exposure');
  }

  if (analysis.color.contrast < 40) {
    suggestions.push('Boost contrast for more punch');
  }

  // Recommend preset based on analysis
  let recommendedPreset: EnhancementPreset = 'auto';
  if (analysis.overall.category === 'poor') {
    recommendedPreset = 'detailed';
  } else if (analysis.overall.category === 'fair') {
    recommendedPreset = 'natural';
  }

  return {
    analysis,
    suggestions,
    recommendedPreset,
  };
}
