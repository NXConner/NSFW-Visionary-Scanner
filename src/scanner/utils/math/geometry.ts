export interface Vec2 {
  x: number;
  y: number;
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}
export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}
export function mul(a: Vec2, k: number): Vec2 {
  return { x: a.x * k, y: a.y * k };
}
export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}
export function len(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}
export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
export function norm(a: Vec2): Vec2 {
  const l = len(a);
  return l > 0 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 };
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function deg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function rotate(p: Vec2, thetaRad: number): Vec2 {
  const c = Math.cos(thetaRad);
  const s = Math.sin(thetaRad);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

export function mean(points: Vec2[]): Vec2 {
  if (!points.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

export function covariance2(points: Vec2[], center: Vec2): { xx: number; xy: number; yy: number } {
  if (!points.length) return { xx: 0, xy: 0, yy: 0 };
  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (const p of points) {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }
  const n = Math.max(1, points.length);
  return { xx: xx / n, xy: xy / n, yy: yy / n };
}

/**
 * Principal axis direction angle via 2x2 covariance eigenvector.
 * Returns theta where rotating by -theta aligns the major axis with +X.
 */
export function principalAxisAngle(points: Vec2[]): number {
  const c = mean(points);
  const cov = covariance2(points, c);
  // Solve eigenvector for largest eigenvalue for symmetric 2x2:
  // [xx xy; xy yy]
  // angle = 0.5 * atan2(2xy, xx-yy)
  const theta = 0.5 * Math.atan2(2 * cov.xy, cov.xx - cov.yy);
  return theta;
}
