import { clamp } from "@/scanner/utils/math/geometry";

export interface ConfidenceInputs {
  edgeDensity: number; // 0..1
  contourPoints: number;
  rmse: number;
  calibrated: boolean;
  warnings: string[];
}

export function computeConfidence(input: ConfidenceInputs): { score: number; context: string } {
  // Start at a sane midpoint; add/subtract based on objective indicators.
  let score = 62;
  const ctx: string[] = [];

  // Edge density: too low => no structure; too high => noisy.
  const d = input.edgeDensity;
  if (d < 0.006) {
    score -= 20;
    ctx.push("Edges are faint; increase lighting/contrast.");
  } else if (d < 0.012) {
    score -= 8;
    ctx.push("Edges are a bit faint.");
  } else if (d > 0.09) {
    score -= 12;
    ctx.push("Image looks noisy; stabilize and avoid motion blur.");
  } else if (d > 0.06) {
    score -= 6;
    ctx.push("Some noise detected.");
  } else {
    score += 6;
    ctx.push("Edges look usable.");
  }

  if (input.contourPoints < 200) {
    score -= 18;
    ctx.push("Not enough contour detail detected.");
  } else if (input.contourPoints < 600) {
    score -= 8;
    ctx.push("Contour detail is limited.");
  } else {
    score += 6;
  }

  // RMSE roughly scales with pixel units; keep heuristic thresholds.
  if (input.rmse > 14) {
    score -= 14;
    ctx.push("Curve fit is unstable; try re-framing.");
  } else if (input.rmse > 9) {
    score -= 8;
  } else {
    score += 6;
  }

  if (input.calibrated) {
    score += 10;
    ctx.push("Calibrated scale detected.");
  } else {
    score -= 8;
    ctx.push("No calibration; length will be less accurate.");
  }

  if (input.warnings.length) score -= Math.min(12, input.warnings.length * 3);

  const bounded = clamp(Math.round(score), 5, 100);
  return { score: bounded, context: ctx.join(" ") };
}
