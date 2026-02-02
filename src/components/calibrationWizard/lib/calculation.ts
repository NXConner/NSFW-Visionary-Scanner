import type { PointPercent } from "@/components/calibrationWizard/types";

const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
  Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

const percentToPixels = (p: PointPercent, widthPx: number, heightPx: number) => ({
  x: (p.x / 100) * widthPx,
  y: (p.y / 100) * heightPx,
});

export function calculatePixelsPerMm({
  cornerPointsPercent,
  imageWidthPx,
  imageHeightPx,
  referenceWidthMm,
  referenceHeightMm,
}: {
  cornerPointsPercent: [PointPercent, PointPercent, PointPercent, PointPercent];
  imageWidthPx: number;
  imageHeightPx: number;
  referenceWidthMm: number;
  referenceHeightMm: number;
}) {
  return calculateCalibrationMetrics({
    cornerPointsPercent,
    imageWidthPx,
    imageHeightPx,
    referenceWidthMm,
    referenceHeightMm,
  }).pixelsPerMm;
}

export function calculateCalibrationMetrics({
  cornerPointsPercent,
  imageWidthPx,
  imageHeightPx,
  referenceWidthMm,
  referenceHeightMm,
}: {
  cornerPointsPercent: [PointPercent, PointPercent, PointPercent, PointPercent];
  imageWidthPx: number;
  imageHeightPx: number;
  referenceWidthMm: number;
  referenceHeightMm: number;
}): {
  pixelsPerMm: number;
  pixelsPerMmWidth: number;
  pixelsPerMmHeight: number;
  avgWidthPx: number;
  avgHeightPx: number;
  skewPercent: number;
  confidence: number; // 0..1
} {
  const pts = cornerPointsPercent.map(p => percentToPixels(p, imageWidthPx, imageHeightPx)) as [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];

  // Expected order: TL, TR, BR, BL
  const width1 = dist(pts[0], pts[1]);
  const width2 = dist(pts[3], pts[2]);
  const height1 = dist(pts[0], pts[3]);
  const height2 = dist(pts[1], pts[2]);

  const avgWidthPx = (width1 + width2) / 2;
  const avgHeightPx = (height1 + height2) / 2;

  const pixelsPerMmWidth = avgWidthPx / referenceWidthMm;
  const pixelsPerMmHeight =
    referenceHeightMm > 0 ? avgHeightPx / referenceHeightMm : pixelsPerMmWidth;

  const pixelsPerMm = (pixelsPerMmWidth + pixelsPerMmHeight) / 2;

  const mean = Math.max(1e-6, (pixelsPerMmWidth + pixelsPerMmHeight) / 2);
  const skew = Math.abs(pixelsPerMmWidth - pixelsPerMmHeight) / mean; // 0..inf
  const skewPercent = Math.max(0, Math.min(100, Math.round(skew * 100)));

  // Confidence heuristic:
  // - penalize skew (perspective/corner error)
  // - penalize tiny reference pixel sizes (low precision)
  const sizeScore = Math.max(0, Math.min(1, Math.min(avgWidthPx, avgHeightPx) / 260));
  const skewScore = Math.max(0, Math.min(1, 1 - skew * 2.2));
  const confidence = Math.max(0, Math.min(1, 0.25 + sizeScore * 0.35 + skewScore * 0.4));

  return {
    pixelsPerMm,
    pixelsPerMmWidth,
    pixelsPerMmHeight,
    avgWidthPx,
    avgHeightPx,
    skewPercent,
    confidence,
  };
}
