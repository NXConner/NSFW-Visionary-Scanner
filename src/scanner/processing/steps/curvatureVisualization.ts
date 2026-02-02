/**
 * Curvature Visualization Utilities
 * 
 * Provides functions to generate visual overlays for landmark-based curvature detection.
 */

import type { Vec2 } from "@/scanner/utils/math/geometry";
import { add, mul, sub, len } from "@/scanner/utils/math/geometry";
import type { LandmarkPoint, LandmarkCurvatureResult } from "./landmarkCurvature";

export interface CurvatureOverlayConfig {
  /** Color for landmark points (HSL string) */
  landmarkColor?: string;
  /** Color for axis lines */
  axisColor?: string;
  /** Color for angle arc */
  arcColor?: string;
  /** Size of landmark markers in pixels */
  markerSize?: number;
  /** Line width for visualization */
  lineWidth?: number;
  /** Show angle arc */
  showArc?: boolean;
  /** Show axis lines */
  showAxisLines?: boolean;
  /** Show landmark labels */
  showLabels?: boolean;
}

const defaultConfig: Required<CurvatureOverlayConfig> = {
  landmarkColor: "hsl(var(--primary))",
  axisColor: "hsl(var(--accent))",
  arcColor: "hsl(45, 100%, 50%)",
  markerSize: 8,
  lineWidth: 2,
  showArc: true,
  showAxisLines: true,
  showLabels: true,
};

/**
 * Generate SVG path for the angle arc between two vectors.
 */
export function generateAngleArcPath(
  center: Vec2,
  v1: Vec2,
  v2: Vec2,
  radius: number
): string {
  // Start point on first vector
  const p1 = add(center, mul(v1, radius));
  // End point on second vector
  const p2 = add(center, mul(v2, radius));
  
  // Determine if arc should be large (>180 degrees)
  const cross = v1.x * v2.y - v1.y * v2.x;
  const largeArc = 0; // Always small arc for curvature
  const sweep = cross > 0 ? 1 : 0;

  return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`;
}

/**
 * Generate visualization data for rendering curvature overlay.
 */
export function generateCurvatureVisualization(
  result: LandmarkCurvatureResult,
  config: CurvatureOverlayConfig = {}
): {
  landmarks: Array<{
    position: Vec2;
    type: string;
    color: string;
    size: number;
    label: string;
  }>;
  axisLines: Array<{
    start: Vec2;
    end: Vec2;
    color: string;
    width: number;
    label: string;
  }>;
  angleArc?: {
    path: string;
    color: string;
    width: number;
    center: Vec2;
    angleDeg: number;
  };
  hingePoint?: {
    position: Vec2;
    color: string;
    size: number;
  };
} {
  const cfg = { ...defaultConfig, ...config };
  
  // Map landmark types to display labels
  const labelMap: Record<string, string> = {
    D1: "Distal 1",
    D2: "Distal 2",
    P1: "Proximal 1",
    P2: "Proximal 2",
  };

  const landmarks = result.landmarks.map(lm => ({
    position: lm.position,
    type: lm.type,
    color: cfg.landmarkColor,
    size: cfg.markerSize,
    label: cfg.showLabels ? labelMap[lm.type] || lm.type : "",
  }));

  // Generate axis lines
  const d1 = result.landmarks.find(l => l.type === "D1");
  const d2 = result.landmarks.find(l => l.type === "D2");
  const p1 = result.landmarks.find(l => l.type === "P1");
  const p2 = result.landmarks.find(l => l.type === "P2");

  const axisLines: Array<{
    start: Vec2;
    end: Vec2;
    color: string;
    width: number;
    label: string;
  }> = [];

  if (cfg.showAxisLines && d1 && d2) {
    axisLines.push({
      start: d1.position,
      end: d2.position,
      color: cfg.axisColor,
      width: cfg.lineWidth,
      label: "Distal Axis",
    });
  }

  if (cfg.showAxisLines && p1 && p2) {
    axisLines.push({
      start: p1.position,
      end: p2.position,
      color: cfg.axisColor,
      width: cfg.lineWidth,
      label: "Proximal Axis",
    });
  }

  // Generate angle arc
  let angleArc: {
    path: string;
    color: string;
    width: number;
    center: Vec2;
    angleDeg: number;
  } | undefined;

  if (cfg.showArc && result.angleDeg > 2 && d1 && d2 && p1 && p2) {
    // Center point for arc visualization - midpoint between regions
    const distalMid = mul(add(d1.position, d2.position), 0.5);
    const proximalMid = mul(add(p1.position, p2.position), 0.5);
    const arcCenter = mul(add(distalMid, proximalMid), 0.5);
    
    // Arc radius based on distance between regions
    const regionDist = len(sub(distalMid, proximalMid));
    const arcRadius = regionDist * 0.3;

    const arcPath = generateAngleArcPath(
      arcCenter,
      result.proximalAxis,
      result.distalAxis,
      arcRadius
    );

    angleArc = {
      path: arcPath,
      color: cfg.arcColor,
      width: cfg.lineWidth,
      center: arcCenter,
      angleDeg: result.angleDeg,
    };
  }

  // Hinge point visualization
  let hingePoint: { position: Vec2; color: string; size: number } | undefined;
  if (result.hingePoint && result.curvatureType === "hinge") {
    hingePoint = {
      position: result.hingePoint,
      color: "hsl(var(--destructive))",
      size: cfg.markerSize * 1.5,
    };
  }

  return { landmarks, axisLines, angleArc, hingePoint };
}

/**
 * Get curvature type display label.
 */
export function getCurvatureTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    hinge: "Hinge Curvature",
    arc: "Arc Curvature",
    complex: "Complex Curvature",
    straight: "Straight",
  };
  return labels[type] || type;
}

/**
 * Get clinical interpretation for curvature result.
 */
export function getCurvatureClinicalNote(result: LandmarkCurvatureResult): string {
  const { angleDeg, direction, curvatureType } = result;
  
  if (angleDeg < 5) {
    return "Curvature within normal range (< 5°)";
  }
  
  if (angleDeg < 15) {
    return `Mild ${direction} curvature detected (${angleDeg.toFixed(1)}°). Generally considered normal variation.`;
  }
  
  if (angleDeg < 30) {
    return `Moderate ${direction} curvature (${angleDeg.toFixed(1)}°). Consider consulting a urologist if symptoms present.`;
  }
  
  if (angleDeg < 45) {
    return `Significant ${direction} ${curvatureType} curvature (${angleDeg.toFixed(1)}°). Medical evaluation recommended.`;
  }
  
  return `Severe ${direction} ${curvatureType} curvature (${angleDeg.toFixed(1)}°). Professional medical consultation advised.`;
}
