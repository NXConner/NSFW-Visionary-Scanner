import type { CurvatureCaptureView } from "@/components/scannerOverlays/CurvatureScanOverlay";
import type { CurvatureDirection } from "@/scanner/measurement/types";
import type { Vec2 } from "@/scanner/utils/math/geometry";
import { clamp, dist, norm, sub } from "@/scanner/utils/math/geometry";

function dot(a: Vec2, b: Vec2) {
  return a.x * b.x + a.y * b.y;
}

function perp(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

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

function pickBaseTip(centerline: Vec2[], basePointPx: Vec2) {
  const baseIdx = nearestIndex(centerline, basePointPx);
  const baseIsNearStart = baseIdx < centerline.length / 2;
  const base = baseIsNearStart ? centerline[0]! : centerline[centerline.length - 1]!;
  const tip = baseIsNearStart ? centerline[centerline.length - 1]! : centerline[0]!;
  return { base, tip };
}

/**
 * Estimate direction using a signed deviation from the straight base->tip axis.
 * - dorsal capture (top-down): returns lateral-left/right
 * - lateral capture (side view): returns dorsal/ventral
 */
export function computeCurvatureDirectionFromCenterline(params: {
  view: CurvatureCaptureView;
  centerlinePx: Array<{ x: number; y: number }>;
  basePointPx: { x: number; y: number };
}): CurvatureDirection {
  const { view, centerlinePx, basePointPx } = params;
  const pts: Vec2[] = centerlinePx.map(p => ({ x: p.x, y: p.y }));
  if (pts.length < 10) return "unknown";

  const { base, tip } = pickBaseTip(pts, basePointPx);
  const axis = norm(sub(tip, base));
  if (!Number.isFinite(axis.x) || !Number.isFinite(axis.y)) return "unknown";

  // signed distance to the base->tip line along a chosen perpendicular
  // We orient the perpendicular consistently to map sign to a screen meaning:
  // - dorsal view: positive => screen-right
  // - lateral view: positive => screen-up (negative y)
  let n = perp(axis);
  n = norm(n);

  if (view === "dorsal") {
    // ensure n points to +x (screen-right)
    if (n.x < 0) n = { x: -n.x, y: -n.y };
  } else {
    // ensure n points to -y (screen-up, since y increases downward)
    if (n.y > 0) n = { x: -n.x, y: -n.y };
  }

  let bestSigned = 0;
  let bestAbs = 0;
  for (const p of pts) {
    const v = sub(p, base);
    const signed = dot(v, n);
    const abs = Math.abs(signed);
    if (abs > bestAbs) {
      bestAbs = abs;
      bestSigned = signed;
    }
  }

  // deadzone to avoid noisy flips (relative to axis length)
  const axisLen = Math.max(1, dist(base, tip));
  const deadzonePx = clamp(axisLen * 0.01, 2, 10);
  if (bestAbs < deadzonePx) return "unknown";

  if (view === "dorsal") {
    return bestSigned >= 0 ? "lateral-right" : "lateral-left";
  }
  return bestSigned >= 0 ? "dorsal" : "ventral";
}
