import type { Vec2 } from "@/scanner/utils/math/geometry";
import { sub } from "@/scanner/utils/math/geometry";

export interface GirthEstimationResult {
  /** Average width in pixels across the centerline. */
  avgWidthPx: number;
  /** Maximum width in pixels (typically at the midpoint). */
  maxWidthPx: number;
  /** Estimated circumference in pixels (avgWidth * π). */
  circumferencePx: number;
  /** Width samples along the centerline for visualization. */
  widthSamples: Array<{ position: Vec2; width: number; normal: Vec2 }>;
}

/**
 * Estimates girth/circumference by measuring the contour width perpendicular to the centerline.
 * 
 * Algorithm:
 * 1. For each point along the centerline, compute the perpendicular (normal) direction
 * 2. Cast rays in both directions from the centerline point
 * 3. Find the nearest contour points in each direction
 * 4. The width at that point is the sum of the two distances
 * 5. Average all width measurements and multiply by π for circumference
 */
export function estimateGirthFromContour(
  centerline: Vec2[],
  contourPoints: Vec2[],
  opts: { sampleCount?: number; outlierPercent?: number } = {},
): GirthEstimationResult | null {
  if (centerline.length < 10 || contourPoints.length < 50) {
    return null;
  }

  const sampleCount = opts.sampleCount ?? 20;
  const outlierPercent = opts.outlierPercent ?? 0.1;

  // Build spatial hash for faster contour point lookup
  const contourHash = buildSpatialHash(contourPoints, 20);

  const widthSamples: GirthEstimationResult["widthSamples"] = [];
  const widths: number[] = [];

  // Skip the first and last 10% of the centerline to avoid edge effects
  const startIdx = Math.floor(centerline.length * 0.1);
  const endIdx = Math.floor(centerline.length * 0.9);
  const step = Math.max(1, Math.floor((endIdx - startIdx) / sampleCount));

  for (let i = startIdx; i < endIdx; i += step) {
    const point = centerline[i]!;
    const normal = computeNormalAtIndex(centerline, i);
    
    if (!normal) continue;

    // Find width by casting rays in both directions
    const width = measureWidthAtPoint(point, normal, contourPoints, contourHash);
    
    if (width && width > 5) { // Minimum reasonable width threshold
      widths.push(width);
      widthSamples.push({ position: point, width, normal });
    }
  }

  if (widths.length < 3) {
    return null;
  }

  // Remove outliers (top and bottom percentiles)
  const sorted = [...widths].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * outlierPercent);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  
  if (trimmed.length < 2) {
    return null;
  }

  const avgWidthPx = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const maxWidthPx = Math.max(...trimmed);
  
  // Circumference = width * π (assuming roughly elliptical cross-section)
  const circumferencePx = avgWidthPx * Math.PI;

  return {
    avgWidthPx,
    maxWidthPx,
    circumferencePx,
    widthSamples,
  };
}

/**
 * Compute the normal (perpendicular) direction at a point on the centerline.
 */
function computeNormalAtIndex(centerline: Vec2[], index: number): Vec2 | null {
  // Use neighboring points to compute tangent
  const prevIdx = Math.max(0, index - 2);
  const nextIdx = Math.min(centerline.length - 1, index + 2);
  
  const prev = centerline[prevIdx]!;
  const next = centerline[nextIdx]!;
  
  const tangent = sub(next, prev);
  const tangentLen = Math.hypot(tangent.x, tangent.y);
  
  if (tangentLen < 0.001) return null;
  
  // Normal is perpendicular to tangent (rotate 90 degrees)
  return {
    x: -tangent.y / tangentLen,
    y: tangent.x / tangentLen,
  };
}

/**
 * Measure width at a point by finding contour intersections in both normal directions.
 */
function measureWidthAtPoint(
  point: Vec2,
  normal: Vec2,
  contourPoints: Vec2[],
  spatialHash: Map<string, Vec2[]>,
): number | null {
  const maxSearchDist = 200; // Max search distance in pixels
  
  // Search in positive normal direction
  const positiveDist = findNearestContourInDirection(
    point, normal, contourPoints, spatialHash, maxSearchDist
  );
  
  // Search in negative normal direction
  const negativeDist = findNearestContourInDirection(
    point, { x: -normal.x, y: -normal.y }, contourPoints, spatialHash, maxSearchDist
  );
  
  if (positiveDist === null || negativeDist === null) {
    return null;
  }
  
  return positiveDist + negativeDist;
}

/**
 * Find the nearest contour point in a given direction from a starting point.
 */
function findNearestContourInDirection(
  start: Vec2,
  direction: Vec2,
  _contourPoints: Vec2[],
  spatialHash: Map<string, Vec2[]>,
  maxDist: number,
): number | null {
  let nearestDist = Infinity;
  
  // Sample points along the ray
  const stepSize = 2;
  const steps = Math.ceil(maxDist / stepSize);
  
  for (let s = 1; s <= steps; s++) {
    const testX = start.x + direction.x * s * stepSize;
    const testY = start.y + direction.y * s * stepSize;
    
    // Get nearby contour points from spatial hash
    const nearby = getNearbyCells(spatialHash, testX, testY, 20);
    
    for (const cp of nearby) {
      const dx = cp.x - start.x;
      const dy = cp.y - start.y;
      
      // Check if point is roughly in the direction we're looking
      const projectionOnDir = dx * direction.x + dy * direction.y;
      if (projectionOnDir < 0) continue; // Behind us
      
      // Check perpendicular distance from the ray
      const perpDist = Math.abs(dx * direction.y - dy * direction.x);
      if (perpDist > 5) continue; // Too far from ray
      
      const d = Math.hypot(dx, dy);
      if (d < nearestDist && d <= maxDist) {
        nearestDist = d;
      }
    }
    
    // Early exit if we found something close
    if (nearestDist < s * stepSize + 10) {
      break;
    }
  }
  
  return Number.isFinite(nearestDist) ? nearestDist : null;
}

/**
 * Build a spatial hash map for faster point lookup.
 */
function buildSpatialHash(points: Vec2[], cellSize: number): Map<string, Vec2[]> {
  const hash = new Map<string, Vec2[]>();
  
  for (const p of points) {
    const key = `${Math.floor(p.x / cellSize)},${Math.floor(p.y / cellSize)}`;
    const cell = hash.get(key);
    if (cell) {
      cell.push(p);
    } else {
      hash.set(key, [p]);
    }
  }
  
  return hash;
}

/**
 * Get points from cells near a given position.
 */
function getNearbyCells(
  hash: Map<string, Vec2[]>,
  x: number,
  y: number,
  cellSize: number,
): Vec2[] {
  const result: Vec2[] = [];
  const cx = Math.floor(x / cellSize);
  const cy = Math.floor(y / cellSize);
  
  // Check 3x3 neighborhood
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cx + dx},${cy + dy}`;
      const cell = hash.get(key);
      if (cell) {
        result.push(...cell);
      }
    }
  }
  
  return result;
}
