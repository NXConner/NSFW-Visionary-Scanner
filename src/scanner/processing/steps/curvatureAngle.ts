import { clamp, deg, norm, sub } from "@/scanner/utils/math/geometry";
import { polyDeriv, polyEval } from "@/scanner/utils/math/polynomial";
import type { CurveFitResult } from "../types";
import type { CurvatureDirection } from "@/scanner/measurement/types";

export function estimateCurvatureFromCenterline(centerline: { x: number; y: number }[]): {
  angleDeg: number;
  direction: CurvatureDirection;
} {
  if (centerline.length < 8) return { angleDeg: 0, direction: "unknown" };

  const n = centerline.length;
  const p0 = centerline[0]!;
  const p1 = centerline[Math.min(n - 1, Math.floor(n * 0.08))]!;
  const q0 = centerline[Math.max(0, Math.floor(n * 0.92))]!;
  const q1 = centerline[n - 1]!;

  const vStart = norm(sub(p1, p0));
  const vEnd = norm(sub(q1, q0));

  // angle between tangents (0..pi)
  const dotp = clamp(vStart.x * vEnd.x + vStart.y * vEnd.y, -1, 1);
  const ang = Math.acos(dotp);
  const angleDeg = clamp(deg(ang), 0, 90);

  // Direction: based on overall deviation from straight chord.
  // We use sign of average cross product between chord and centerline deviation.
  const chord = sub(q1, p0);
  const chordN = norm(chord);
  let signed = 0;
  for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 24))) {
    const pt = centerline[i]!;
    const rel = sub(pt, p0);
    // cross(chord, rel) in 2D (z-component)
    signed += chordN.x * rel.y - chordN.y * rel.x;
  }

  // Map to friendly labels; for a generic scanner we keep lateral vs dorsal/ventral.
  // With no anatomical frame, we treat positive as "dorsal" and negative as "ventral".
  const direction: CurvatureDirection =
    Math.abs(signed) < 1e-2 ? "unknown" : signed > 0 ? "dorsal" : "ventral";

  return { angleDeg, direction };
}

/**
 * Optional curvature estimate using polynomial derivative in rotated space.
 * Currently we prefer centerline tangent angle delta because it survives imperfect fits.
 */
export function curvatureFromPolynomial(_fit: CurveFitResult): number {
  const d = polyDeriv(_fit.polyCoeffs);
  void polyEval;
  void d;
  return 0;
}

