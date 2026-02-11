import type { Vec2 } from "@/scanner/utils/math/geometry";
import { clamp, mean, principalAxisAngle, rotate } from "@/scanner/utils/math/geometry";
import { polyDeriv, polyEval, polyFit, rmse } from "@/scanner/utils/math/polynomial";
import type { CurveFitResult } from "../types";

function rotateAround(points: Vec2[], center: Vec2, theta: number): Vec2[] {
  return points.map(p => {
    const r = rotate({ x: p.x - center.x, y: p.y - center.y }, theta);
    return { x: r.x, y: r.y };
  });
}

function inverseRotateAround(points: Vec2[], center: Vec2, theta: number): Vec2[] {
  return points.map(p => {
    const r = rotate({ x: p.x, y: p.y }, -theta);
    return { x: r.x + center.x, y: r.y + center.y };
  });
}

/**
 * Build a centerline by sampling along X in rotated space:
 * For each x bin, take midpoint of minY/maxY edge points.
 */
function centerlineFromEdgesRotated(pointsRot: Vec2[], bins: number): Vec2[] {
  if (pointsRot.length < 50) return [];

  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of pointsRot) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }
  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || maxX - minX < 5) return [];

  const b = clamp(Math.floor(bins), 32, 256);
  const minY = new Array<number>(b).fill(Infinity);
  const maxY = new Array<number>(b).fill(-Infinity);

  const span = maxX - minX;
  for (const p of pointsRot) {
    const t = (p.x - minX) / span;
    const i = clamp(Math.floor(t * (b - 1)), 0, b - 1);
    if (p.y < minY[i]!) minY[i] = p.y;
    if (p.y > maxY[i]!) maxY[i] = p.y;
  }

  const out: Vec2[] = [];
  for (let i = 0; i < b; i++) {
    if (!Number.isFinite(minY[i]!) || !Number.isFinite(maxY[i]!)) continue;
    const x = minX + (i / (b - 1)) * span;
    const y = (minY[i]! + maxY[i]!) / 2;
    out.push({ x, y });
  }

  // remove isolated gaps
  if (out.length < 12) return [];
  return out;
}

export function fitCurve(points: Vec2[], opts: { degree?: number } = {}): CurveFitResult | null {
  if (points.length < 80) return null;
  const center = mean(points);
  const theta = principalAxisAngle(points);

  // Rotate by -theta to align major axis with X.
  const rot = rotateAround(points, center, -theta);
  const centerlineRot = centerlineFromEdgesRotated(rot, 160);
  if (centerlineRot.length < 20) return null;

  const xs = centerlineRot.map(p => p.x);
  const ys = centerlineRot.map(p => p.y);
  const degree = clamp(Math.floor(opts.degree ?? 3), 1, 5);
  const coeffs = polyFit(xs, ys, degree);
  const err = rmse(xs, ys, coeffs);

  // Reconstruct dense centerline from polynomial for annotation + length
  let minX = xs[0]!;
  let maxX = xs[xs.length - 1]!;
  for (const x of xs) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  // Adaptive sample count based on span - smaller images need fewer samples
  const span = maxX - minX;
  const samples = clamp(Math.floor(span * 0.5), 60, 200);
  const denseRot: Vec2[] = new Array(samples);
  const step = span / (samples - 1);
  for (let i = 0; i < samples; i++) {
    const x = minX + i * step;
    denseRot[i] = { x, y: polyEval(coeffs, x) };
  }

  const dense = inverseRotateAround(denseRot, center, -theta); // inverse of rotateAround(...,-theta)

  // Tangent endpoints sanity uses derivative but not stored here.
  void polyDeriv;

  return {
    centerline: dense,
    polyCoeffs: coeffs,
    thetaRad: theta,
    rmse: err,
  };
}
