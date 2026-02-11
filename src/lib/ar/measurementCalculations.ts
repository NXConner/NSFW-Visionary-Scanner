/**
 * AR Measurement Calculations
 * Mathematical utilities for real-time AR measurement overlay
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectionLandmark {
  id: string;
  point: Point2D;
  confidence: number;
  type: "reference" | "measurement" | "anchor";
}

export interface MeasurementLine {
  start: Point2D;
  end: Point2D;
  distance: number;
  unit: "px" | "mm" | "cm" | "in";
  confidence: number;
}

export interface QualityMetrics {
  overall: number; // 0-100
  lighting: number;
  stability: number;
  angle: number;
  distance: number;
  focus: number;
}

export type PositionStatus = "good" | "adjust" | "poor";

export interface PositionFeedback {
  status: PositionStatus;
  message: string;
  adjustments: {
    moveLeft?: number;
    moveRight?: number;
    moveUp?: number;
    moveDown?: number;
    moveCloser?: number;
    moveFarther?: number;
    tiltLeft?: number;
    tiltRight?: number;
  };
}

// ======= Distance Calculations =======

/**
 * Calculate Euclidean distance between two 2D points
 */
export function calculateDistance2D(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Euclidean distance between two 3D points
 */
export function calculateDistance3D(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Convert pixel distance to real-world units using reference scale
 */
export function pixelsToRealWorld(
  pixelDistance: number,
  referencePixels: number,
  referenceRealWorld: number,
  unit: "mm" | "cm" | "in" = "mm",
): number {
  if (referencePixels === 0) return 0;
  const ratio = referenceRealWorld / referencePixels;
  return pixelDistance * ratio;
}

// ======= Angle Calculations =======

/**
 * Calculate angle between two points relative to horizontal axis
 */
export function calculateAngle(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Calculate angle between three points (vertex at p2)
 */
export function calculateAngleBetweenPoints(p1: Point2D, p2: Point2D, p3: Point2D): number {
  const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
  const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
  let angle = (angle2 - angle1) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

// ======= Quality Assessment =======

/**
 * Assess lighting quality from image brightness histogram
 */
export function assessLightingQuality(brightness: number[]): number {
  if (brightness.length === 0) return 50;

  const avg = brightness.reduce((a, b) => a + b, 0) / brightness.length;
  const variance =
    brightness.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / brightness.length;
  const stdDev = Math.sqrt(variance);

  // Optimal brightness around 128 (middle gray)
  const brightnessScore = 100 - Math.abs(avg - 128) / 1.28;
  // Some variance is good, but not too much
  const contrastScore = Math.min(100, stdDev * 2);

  return Math.round(brightnessScore * 0.6 + contrastScore * 0.4);
}

/**
 * Assess image stability from frame-to-frame motion
 */
export function assessStability(previousPoints: Point2D[], currentPoints: Point2D[]): number {
  if (previousPoints.length === 0 || currentPoints.length === 0) return 100;
  if (previousPoints.length !== currentPoints.length) return 50;

  const movements = previousPoints.map((prev, i) => calculateDistance2D(prev, currentPoints[i]));

  const avgMovement = movements.reduce((a, b) => a + b, 0) / movements.length;

  // Less movement = more stable (max movement threshold = 50px)
  const stabilityScore = Math.max(0, 100 - avgMovement * 2);
  return Math.round(stabilityScore);
}

/**
 * Assess capture angle quality
 */
export function assessAngleQuality(
  detectedAngle: number,
  optimalAngle: number,
  tolerance: number = 15,
): number {
  const deviation = Math.abs(detectedAngle - optimalAngle);
  if (deviation <= tolerance) return 100;
  if (deviation >= tolerance * 3) return 0;
  return Math.round(100 - ((deviation - tolerance) / (tolerance * 2)) * 100);
}

/**
 * Calculate overall quality score from individual metrics
 */
export function calculateOverallQuality(metrics: Omit<QualityMetrics, "overall">): QualityMetrics {
  const weights = {
    lighting: 0.2,
    stability: 0.25,
    angle: 0.2,
    distance: 0.2,
    focus: 0.15,
  };

  const overall = Math.round(
    metrics.lighting * weights.lighting +
      metrics.stability * weights.stability +
      metrics.angle * weights.angle +
      metrics.distance * weights.distance +
      metrics.focus * weights.focus,
  );

  return { ...metrics, overall };
}

// ======= Position Feedback =======

/**
 * Determine position status based on quality score
 */
export function getPositionStatus(qualityScore: number): PositionStatus {
  if (qualityScore >= 75) return "good";
  if (qualityScore >= 45) return "adjust";
  return "poor";
}

/**
 * Generate position feedback based on detection landmarks
 */
export function generatePositionFeedback(
  landmarks: DetectionLandmark[],
  targetBounds: BoundingBox,
  currentBounds: BoundingBox,
): PositionFeedback {
  const adjustments: PositionFeedback["adjustments"] = {};
  let message = "";

  // Calculate center offsets
  const targetCenterX = targetBounds.x + targetBounds.width / 2;
  const targetCenterY = targetBounds.y + targetBounds.height / 2;
  const currentCenterX = currentBounds.x + currentBounds.width / 2;
  const currentCenterY = currentBounds.y + currentBounds.height / 2;

  const offsetX = targetCenterX - currentCenterX;
  const offsetY = targetCenterY - currentCenterY;
  const threshold = 20; // pixels

  // Horizontal adjustment
  if (offsetX > threshold) {
    adjustments.moveRight = offsetX;
    message = "Move slightly right";
  } else if (offsetX < -threshold) {
    adjustments.moveLeft = Math.abs(offsetX);
    message = "Move slightly left";
  }

  // Vertical adjustment
  if (offsetY > threshold) {
    adjustments.moveDown = offsetY;
    message = message ? `${message}, move down` : "Move down";
  } else if (offsetY < -threshold) {
    adjustments.moveUp = Math.abs(offsetY);
    message = message ? `${message}, move up` : "Move up";
  }

  // Size/distance adjustment
  const sizeRatio =
    (currentBounds.width * currentBounds.height) / (targetBounds.width * targetBounds.height);

  if (sizeRatio < 0.7) {
    adjustments.moveCloser = Math.round((1 - sizeRatio) * 100);
    message = message ? `${message}, move closer` : "Move closer";
  } else if (sizeRatio > 1.3) {
    adjustments.moveFarther = Math.round((sizeRatio - 1) * 100);
    message = message ? `${message}, move back` : "Move back";
  }

  // Determine overall status
  const hasSignificantAdjustments =
    Math.abs(offsetX) > threshold * 2 ||
    Math.abs(offsetY) > threshold * 2 ||
    sizeRatio < 0.5 ||
    sizeRatio > 1.5;

  const status: PositionStatus = !message ? "good" : hasSignificantAdjustments ? "poor" : "adjust";

  return {
    status,
    message: message || "Position looks good!",
    adjustments,
  };
}

// ======= Measurement Line Generation =======

/**
 * Generate measurement lines from detected landmarks
 */
export function generateMeasurementLines(
  landmarks: DetectionLandmark[],
  referencePixels: number,
  referenceRealWorld: number,
  unit: "mm" | "cm" | "in" = "mm",
): MeasurementLine[] {
  const lines: MeasurementLine[] = [];
  const measurementLandmarks = landmarks.filter(l => l.type === "measurement");

  // Connect consecutive measurement landmarks
  for (let i = 0; i < measurementLandmarks.length - 1; i += 2) {
    const start = measurementLandmarks[i];
    const end = measurementLandmarks[i + 1];

    if (!start || !end) continue;

    const pixelDistance = calculateDistance2D(start.point, end.point);
    const realDistance = pixelsToRealWorld(
      pixelDistance,
      referencePixels,
      referenceRealWorld,
      unit,
    );
    const avgConfidence = (start.confidence + end.confidence) / 2;

    lines.push({
      start: start.point,
      end: end.point,
      distance: Math.round(realDistance * 10) / 10,
      unit,
      confidence: avgConfidence,
    });
  }

  return lines;
}

// ======= Smoothing and Filtering =======

/**
 * Apply exponential smoothing to a point
 */
export function smoothPoint(
  current: Point2D,
  previous: Point2D | null,
  alpha: number = 0.3,
): Point2D {
  if (!previous) return current;
  return {
    x: alpha * current.x + (1 - alpha) * previous.x,
    y: alpha * current.y + (1 - alpha) * previous.y,
  };
}

/**
 * Apply Kalman-like filter for landmark tracking
 */
export function filterLandmarks(
  currentLandmarks: DetectionLandmark[],
  previousLandmarks: DetectionLandmark[],
  smoothingFactor: number = 0.3,
): DetectionLandmark[] {
  return currentLandmarks.map(current => {
    const previous = previousLandmarks.find(p => p.id === current.id);
    if (!previous) return current;

    return {
      ...current,
      point: smoothPoint(current.point, previous.point, smoothingFactor),
      confidence:
        current.confidence * smoothingFactor + previous.confidence * (1 - smoothingFactor),
    };
  });
}

/**
 * Calculate centroid of landmarks
 */
export function calculateCentroid(landmarks: DetectionLandmark[]): Point2D {
  if (landmarks.length === 0) return { x: 0, y: 0 };

  const sum = landmarks.reduce((acc, l) => ({ x: acc.x + l.point.x, y: acc.y + l.point.y }), {
    x: 0,
    y: 0,
  });

  return {
    x: sum.x / landmarks.length,
    y: sum.y / landmarks.length,
  };
}
