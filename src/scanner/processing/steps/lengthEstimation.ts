import type { Vec2 } from "@/scanner/utils/math/geometry";
import { dist } from "@/scanner/utils/math/geometry";

export function polylineLengthPx(points: Vec2[]): number {
  if (points.length < 2) return 0;
  let s = 0;
  for (let i = 1; i < points.length; i++) s += dist(points[i - 1]!, points[i]!);
  return s;
}
