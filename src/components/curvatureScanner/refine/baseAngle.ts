import type { Vec2 } from "@/scanner/utils/math/geometry";
import { clamp, deg, dist, norm, sub } from "@/scanner/utils/math/geometry";

function nearestIndex(points: Vec2[], target: Vec2): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = dist(points[i]!, target);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function endTangents(points: Vec2[]): { base: Vec2; tip: Vec2 } {
  const n = points.length;
  const step = Math.max(3, Math.floor(n * 0.04));
  const base = norm(sub(points[clamp(step, 0, n - 1)]!, points[0]!));
  const tip = norm(sub(points[n - 1]!, points[clamp(n - 1 - step, 0, n - 1)]!));
  return { base, tip };
}

/**
 * Base-relative angle (degrees):
 * - base end chosen by closest endpoint to the user-picked base point
 * - angle computed between tangent near base and tangent near tip
 */
export function computeBaseAnchoredAngleDeg(
  centerline: Vec2[],
  basePointPx: Vec2,
): number | null {
  if (centerline.length < 10) return null;

  const baseIdx = nearestIndex(centerline, basePointPx);
  const baseIsNearStart = baseIdx < centerline.length / 2;
  const ordered = baseIsNearStart ? centerline : [...centerline].reverse();
  const { base: vBase, tip: vTip } = endTangents(ordered);

  const dotp = clamp(vBase.x * vTip.x + vBase.y * vTip.y, -1, 1);
  const ang = Math.acos(dotp);
  return clamp(deg(ang), 0, 90);
}

