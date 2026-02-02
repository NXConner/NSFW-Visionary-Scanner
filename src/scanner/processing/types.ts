import type { Vec2 } from "../utils/math/geometry";

export interface ProcessingOptions {
  /** Max dimension used for processing (keeps aspect). */
  maxDim?: number;
  /** Edge threshold (0..255); if omitted, chosen automatically from histogram. */
  edgeThreshold?: number;
  /** Polynomial degree for curve fit. */
  polyDegree?: number;
}

export interface EdgeMap {
  width: number;
  height: number;
  /** 0/1 binary edge map, row-major. */
  data: Uint8Array;
}

export interface ContourExtractionResult {
  /** Points in processing canvas coordinates (px). */
  points: Vec2[];
  /** How many connected components were considered. */
  componentCount: number;
}

export interface CurveFitResult {
  /** Centerline samples in processing canvas coordinates (px). */
  centerline: Vec2[];
  /** Polynomial coefficients for y(x) in rotated coordinate system. */
  polyCoeffs: number[];
  /** Rotation that was applied (radians). */
  thetaRad: number;
  /** RMS error in rotated space. */
  rmse: number;
}

