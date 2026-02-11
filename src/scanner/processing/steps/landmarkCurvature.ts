/**
 * 4-Point Landmark-Based Curvature Detection
 *
 * Implementation based on methodology from PMC10150132:
 * "Automated deep learning-based method for measuring penile curvature from 2D images"
 *
 * Uses 4 key landmarks to calculate curvature angle via vector analysis:
 * - Distal mid-axis point 1 (D1) and 2 (D2) - near the tip
 * - Proximal mid-axis point 1 (P1) and 2 (P2) - near the base
 *
 * Supports both curvature types:
 * - Hinge curvature: Sharp bend at single point
 * - Arc curvature: Gradual curve along length
 */

import type { Vec2 } from "@/scanner/utils/math/geometry";
import { add, sub, norm, len, dot, clamp, deg, mul } from "@/scanner/utils/math/geometry";
import type { CurvatureDirection } from "@/scanner/measurement/types";

export type CurvatureType = "hinge" | "arc" | "complex" | "straight";

export interface LandmarkPoint {
  /** Position in image coordinates (px) */
  position: Vec2;
  /** Landmark type identifier */
  type: "D1" | "D2" | "P1" | "P2";
  /** Confidence score (0-1) */
  confidence: number;
}

export interface LandmarkCurvatureResult {
  /** Curvature angle in degrees (0-90) */
  angleDeg: number;
  /** Clinical curvature direction */
  direction: CurvatureDirection;
  /** Curvature type classification */
  curvatureType: CurvatureType;
  /** Detected landmark points */
  landmarks: LandmarkPoint[];
  /** Distal axis vector (normalized) */
  distalAxis: Vec2;
  /** Proximal axis vector (normalized) */
  proximalAxis: Vec2;
  /** Point of maximum curvature (for hinge type) */
  hingePoint?: Vec2;
  /** Confidence score for the overall detection (0-1) */
  confidence: number;
  /** Method used for detection */
  method: "4-point-landmark" | "centerline-fallback";
}

/**
 * Detects 4-point landmarks from centerline by analyzing curvature patterns.
 * Uses the centerline as a proxy for shaft segmentation (UNet equivalent).
 */
export function detectLandmarksFromCenterline(
  centerline: Vec2[],
  contourPoints: Vec2[],
): LandmarkPoint[] {
  if (centerline.length < 16) return [];

  const n = centerline.length;

  // Divide centerline into proximal (base) and distal (tip) regions
  // Per research: landmarks at 10% and 90% of shaft length
  const distalRegionStart = Math.floor(n * 0.85);
  const distalRegionEnd = n - 1;
  const proximalRegionStart = 0;
  const proximalRegionEnd = Math.floor(n * 0.15);

  // Calculate mid-axis points by finding contour width at each region
  const d1Pos = centerline[distalRegionStart]!;
  const d2Pos = centerline[distalRegionEnd]!;
  const p1Pos = centerline[proximalRegionStart]!;
  const p2Pos = centerline[proximalRegionEnd]!;

  // Estimate confidence based on contour coverage
  const contourCoverage =
    contourPoints.length > 200 ? 0.9 : contourPoints.length > 100 ? 0.75 : 0.5;

  const landmarks: LandmarkPoint[] = [
    { position: d1Pos, type: "D1", confidence: contourCoverage },
    { position: d2Pos, type: "D2", confidence: contourCoverage },
    { position: p1Pos, type: "P1", confidence: contourCoverage },
    { position: p2Pos, type: "P2", confidence: contourCoverage },
  ];

  return landmarks;
}

/**
 * Enhanced landmark detection using contour edge analysis.
 * Finds the actual mid-points of the shaft at distal and proximal regions.
 */
export function detectLandmarksEnhanced(
  centerline: Vec2[],
  contourPoints: Vec2[],
  imageWidth: number,
  imageHeight: number,
): LandmarkPoint[] {
  if (centerline.length < 16 || contourPoints.length < 50) {
    return detectLandmarksFromCenterline(centerline, contourPoints);
  }

  const n = centerline.length;

  // Build spatial index for contour points
  const cellSize = Math.max(imageWidth, imageHeight) / 50;
  const contourGrid = new Map<string, Vec2[]>();

  for (const pt of contourPoints) {
    const key = `${Math.floor(pt.x / cellSize)},${Math.floor(pt.y / cellSize)}`;
    if (!contourGrid.has(key)) contourGrid.set(key, []);
    contourGrid.get(key)!.push(pt);
  }

  // Find mid-axis points using perpendicular width at key positions
  const findMidAxisPoint = (centerIdx: number): { midPoint: Vec2; confidence: number } => {
    const pt = centerline[centerIdx]!;

    // Get local tangent direction
    const prevIdx = Math.max(0, centerIdx - 2);
    const nextIdx = Math.min(n - 1, centerIdx + 2);
    const tangent = norm(sub(centerline[nextIdx]!, centerline[prevIdx]!));

    // Perpendicular direction
    const perpendicular: Vec2 = { x: -tangent.y, y: tangent.x };

    // Cast rays in both directions to find contour edges
    let leftDist = 0;
    let rightDist = 0;
    const maxRayLength = Math.max(imageWidth, imageHeight) * 0.3;

    for (let d = 1; d < maxRayLength; d += 2) {
      const leftPt = add(pt, mul(perpendicular, d));
      const rightPt = add(pt, mul(perpendicular, -d));

      // Check if we've hit contour
      const leftKey = `${Math.floor(leftPt.x / cellSize)},${Math.floor(leftPt.y / cellSize)}`;
      const rightKey = `${Math.floor(rightPt.x / cellSize)},${Math.floor(rightPt.y / cellSize)}`;

      if (leftDist === 0 && contourGrid.has(leftKey)) {
        const nearbyPoints = contourGrid.get(leftKey)!;
        for (const cp of nearbyPoints) {
          if (len(sub(cp, leftPt)) < cellSize * 2) {
            leftDist = d;
            break;
          }
        }
      }

      if (rightDist === 0 && contourGrid.has(rightKey)) {
        const nearbyPoints = contourGrid.get(rightKey)!;
        for (const cp of nearbyPoints) {
          if (len(sub(cp, rightPt)) < cellSize * 2) {
            rightDist = d;
            break;
          }
        }
      }

      if (leftDist > 0 && rightDist > 0) break;
    }

    // Calculate mid-point between contour edges
    const totalWidth = leftDist + rightDist;
    const offset = (rightDist - leftDist) / 2;
    const midPoint = add(pt, mul(perpendicular, offset));

    // Confidence based on symmetry and edge detection success
    const symmetry = totalWidth > 0 ? 1 - Math.abs(leftDist - rightDist) / totalWidth : 0;
    const edgeSuccess = (leftDist > 0 ? 0.5 : 0) + (rightDist > 0 ? 0.5 : 0);
    const confidence = symmetry * 0.4 + edgeSuccess * 0.6;

    return { midPoint, confidence };
  };

  // Get positions at 10%, 15%, 85%, 90% of centerline length
  const proximalIdx1 = Math.floor(n * 0.05);
  const proximalIdx2 = Math.floor(n * 0.15);
  const distalIdx1 = Math.floor(n * 0.85);
  const distalIdx2 = Math.floor(n * 0.95);

  const p1 = findMidAxisPoint(proximalIdx1);
  const p2 = findMidAxisPoint(proximalIdx2);
  const d1 = findMidAxisPoint(distalIdx1);
  const d2 = findMidAxisPoint(distalIdx2);

  return [
    { position: d1.midPoint, type: "D1", confidence: d1.confidence },
    { position: d2.midPoint, type: "D2", confidence: d2.confidence },
    { position: p1.midPoint, type: "P1", confidence: p1.confidence },
    { position: p2.midPoint, type: "P2", confidence: p2.confidence },
  ];
}

/**
 * Calculate curvature angle using the 4-point landmark method.
 * Implements vector angle calculation as per PMC10150132 methodology.
 */
export function calculateLandmarkCurvature(
  landmarks: LandmarkPoint[],
): Omit<LandmarkCurvatureResult, "landmarks" | "method"> {
  // Find each landmark type
  const d1 = landmarks.find(l => l.type === "D1");
  const d2 = landmarks.find(l => l.type === "D2");
  const p1 = landmarks.find(l => l.type === "P1");
  const p2 = landmarks.find(l => l.type === "P2");

  if (!d1 || !d2 || !p1 || !p2) {
    return {
      angleDeg: 0,
      direction: "unknown",
      curvatureType: "straight",
      distalAxis: { x: 0, y: 1 },
      proximalAxis: { x: 0, y: 1 },
      confidence: 0,
    };
  }

  // Calculate axis vectors
  // Distal axis: vector from D1 to D2 (tip region)
  const distalAxis = norm(sub(d2.position, d1.position));

  // Proximal axis: vector from P1 to P2 (base region)
  const proximalAxis = norm(sub(p2.position, p1.position));

  // Calculate angle between vectors using dot product
  // θ = arccos(v1 · v2)
  const dotProduct = dot(distalAxis, proximalAxis);
  const clampedDot = clamp(dotProduct, -1, 1);
  const angleRad = Math.acos(clampedDot);
  const angleDeg = clamp(deg(angleRad), 0, 90);

  // Determine direction using cross product (2D: z-component)
  // Cross product gives sign of rotation from proximal to distal
  const crossZ = proximalAxis.x * distalAxis.y - proximalAxis.y * distalAxis.x;

  // Map cross product sign to anatomical direction
  // Positive cross = counterclockwise rotation = dorsal (upward) curvature
  // Negative cross = clockwise rotation = ventral (downward) curvature
  let direction: CurvatureDirection;
  if (Math.abs(angleDeg) < 5) {
    direction = "unknown"; // Essentially straight
  } else if (Math.abs(crossZ) < 0.1) {
    // Minimal lateral component - could be lateral curvature
    direction = distalAxis.x > proximalAxis.x ? "lateral-right" : "lateral-left";
  } else {
    direction = crossZ > 0 ? "dorsal" : "ventral";
  }

  // Classify curvature type
  const curvatureType = classifyCurvatureType(angleDeg, landmarks);

  // Calculate hinge point for hinge-type curvature
  let hingePoint: Vec2 | undefined;
  if (curvatureType === "hinge") {
    // Hinge point is approximately at the intersection of extended axis lines
    // Simplified: midpoint between distal and proximal regions
    const midD = mul(add(d1.position, d2.position), 0.5);
    const midP = mul(add(p1.position, p2.position), 0.5);
    hingePoint = mul(add(midD, midP), 0.5);
  }

  // Overall confidence is weighted average of landmark confidences
  const avgConfidence = (d1.confidence + d2.confidence + p1.confidence + p2.confidence) / 4;
  const angleConfidence = angleDeg > 5 ? 0.9 : 0.7; // Higher confidence for clear curvature
  const confidence = avgConfidence * 0.6 + angleConfidence * 0.4;

  return {
    angleDeg,
    direction,
    curvatureType,
    distalAxis,
    proximalAxis,
    hingePoint,
    confidence,
  };
}

/**
 * Classify whether curvature is hinge-type (sharp bend) or arc-type (gradual).
 */
function classifyCurvatureType(angleDeg: number, landmarks: LandmarkPoint[]): CurvatureType {
  if (angleDeg < 5) return "straight";

  // For more accurate classification, we'd need the full centerline
  // and analyze curvature distribution along its length.
  // Simplified heuristic: high angles often indicate hinge type
  if (angleDeg > 45) return "hinge";
  if (angleDeg > 15) return "arc";

  return "straight";
}

/**
 * Main entry point: Estimate curvature using 4-point landmark method.
 * Falls back to centerline-based estimation if landmarks fail.
 */
export function estimateCurvatureFromLandmarks(
  centerline: Vec2[],
  contourPoints: Vec2[],
  imageWidth: number,
  imageHeight: number,
): LandmarkCurvatureResult {
  // Try enhanced landmark detection first
  let landmarks = detectLandmarksEnhanced(centerline, contourPoints, imageWidth, imageHeight);

  if (landmarks.length < 4) {
    // Fallback to basic centerline-based landmarks
    landmarks = detectLandmarksFromCenterline(centerline, contourPoints);
  }

  if (landmarks.length < 4) {
    // Final fallback: create landmarks from centerline endpoints
    const n = centerline.length;
    if (n >= 4) {
      landmarks = [
        { position: centerline[Math.floor(n * 0.85)]!, type: "D1", confidence: 0.3 },
        { position: centerline[n - 1]!, type: "D2", confidence: 0.3 },
        { position: centerline[0]!, type: "P1", confidence: 0.3 },
        { position: centerline[Math.floor(n * 0.15)]!, type: "P2", confidence: 0.3 },
      ];
    }
  }

  const curvatureResult = calculateLandmarkCurvature(landmarks);

  return {
    ...curvatureResult,
    landmarks,
    method:
      landmarks.length >= 4 && curvatureResult.confidence > 0.5
        ? "4-point-landmark"
        : "centerline-fallback",
  };
}

/**
 * Analyze curvature distribution along centerline for type classification.
 * Returns curvature samples for visualization and arc/hinge determination.
 */
export function analyzeCurvatureDistribution(
  centerline: Vec2[],
  sampleCount: number = 20,
): Array<{ position: Vec2; curvature: number; index: number }> {
  if (centerline.length < 10) return [];

  const n = centerline.length;
  const step = Math.max(1, Math.floor((n - 4) / sampleCount));
  const samples: Array<{ position: Vec2; curvature: number; index: number }> = [];

  for (let i = 2; i < n - 2; i += step) {
    const prev = centerline[i - 2]!;
    const curr = centerline[i]!;
    const next = centerline[i + 2]!;

    // Local curvature via angle change
    const v1 = norm(sub(curr, prev));
    const v2 = norm(sub(next, curr));

    const dotP = clamp(dot(v1, v2), -1, 1);
    const localAngle = Math.acos(dotP);
    const curvature = deg(localAngle);

    samples.push({
      position: curr,
      curvature,
      index: i,
    });
  }

  return samples;
}
