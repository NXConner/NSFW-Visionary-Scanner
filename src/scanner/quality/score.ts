import { sobelEdges } from "@/scanner/processing/steps/edgeDetection";
import { toGrayscale } from "@/scanner/processing/steps/preprocess";

export type LiveQualityScores = {
  /** 0..100 */
  lightingScore: number;
  /** 0..100 */
  sharpnessScore: number;
  /** 0..100 composite */
  qualityScore: number;
  debug: {
    meanLuma: number;
    stdLuma: number;
    edgeMean: number;
    edgeDensity: number;
  };
};

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function clamp100(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function meanStd(gray: Uint8Array): { mean: number; std: number } {
  const n = gray.length || 1;
  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i] ?? 0;
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < gray.length; i++) {
    const d = (gray[i] ?? 0) - mean;
    varSum += d * d;
  }
  const std = Math.sqrt(varSum / n);
  return { mean, std };
}

export function computeLiveQualityScores(imageData: ImageData): LiveQualityScores {
  const { width, height } = imageData;
  const gray = toGrayscale(imageData);
  const { mean, std } = meanStd(gray);

  // Lighting: prefer midtones, penalize extremes.
  // mean near 127 => best; allow wide range.
  const meanNorm = clamp01(mean / 255);
  const meanPenalty = Math.abs(meanNorm - 0.5) / 0.5; // 0..1
  const meanScore = 1 - meanPenalty; // 1 at center, 0 at extremes

  // Contrast: prefer some variance; too low => flat/noisy underexposed, too high => clipped.
  // std in [0..~80] typical for 8-bit images; target around 45.
  const stdNorm = clamp01(std / 80);
  const stdTarget = 0.56; // ~45/80
  const stdPenalty = Math.abs(stdNorm - stdTarget) / stdTarget; // 0..~?
  const stdScore = 1 - Math.min(1, stdPenalty);

  const lightingScore = clamp100((meanScore * 0.65 + stdScore * 0.35) * 100);

  // Sharpness: average edge magnitude (from Sobel) on the downscaled preview.
  const mag = sobelEdges(gray, width, height);
  let edgeSum = 0;
  let edgePx = 0;
  const n = Math.max(1, mag.length);
  // Compute mean edge magnitude and density above a small threshold.
  // (Fixed threshold works because input is already downscaled and stabilized.)
  const t = 18;
  for (let i = 0; i < mag.length; i++) {
    const v = mag[i] ?? 0;
    edgeSum += v;
    if (v >= t) edgePx++;
  }
  const edgeMean = edgeSum / n;
  const edgeDensity = edgePx / n; // 0..1

  // Map edgeMean and edgeDensity to 0..100.
  // EdgeMean typical range depends on scene; we target ~25..60 as "sharp".
  const edgeMeanNorm = clamp01((edgeMean - 18) / 55);
  const edgeDensityNorm = clamp01((edgeDensity - 0.01) / 0.08);
  const sharpnessScore = clamp100((edgeMeanNorm * 0.7 + edgeDensityNorm * 0.3) * 100);

  // Composite: lighting matters but sharpness is the killer for measurement accuracy.
  const qualityScore = clamp100(lightingScore * 0.45 + sharpnessScore * 0.55);

  return {
    lightingScore,
    sharpnessScore,
    qualityScore,
    debug: {
      meanLuma: mean,
      stdLuma: std,
      edgeMean,
      edgeDensity,
    },
  };
}
