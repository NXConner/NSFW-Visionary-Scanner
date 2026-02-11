/**
 * Hook for real-time landmark curvature detection from pipeline output.
 * Uses the 4-point landmark method from PMC10150132.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { LandmarkCurvatureResult } from "@/scanner/processing/steps/landmarkCurvature";
import { estimateCurvatureFromLandmarks } from "@/scanner/processing/steps/landmarkCurvature";
import type { Vec2 } from "@/scanner/utils/math/geometry";

export interface UseLandmarkCurvatureOptions {
  /** Whether detection is enabled */
  enabled: boolean;
  /** Centerline points from pipeline (in processing coordinates) */
  centerline: Vec2[];
  /** Contour points from pipeline */
  contourPoints: Vec2[];
  /** Image dimensions for landmark detection */
  imageWidth: number;
  imageHeight: number;
  /** Scale factor to convert from processing to original coordinates */
  invScale?: number;
  /** Minimum confidence to consider result valid */
  minConfidence?: number;
  /** Debounce interval in ms */
  debounceMs?: number;
}

export interface UseLandmarkCurvatureReturn {
  /** Current curvature result */
  result: LandmarkCurvatureResult | null;
  /** Whether detection is currently running */
  isProcessing: boolean;
  /** Last update timestamp */
  lastUpdated: number | null;
  /** Force a re-detection */
  refresh: () => void;
}

export function useLandmarkCurvature({
  enabled,
  centerline,
  contourPoints,
  imageWidth,
  imageHeight,
  invScale = 1,
  minConfidence = 0.3,
  debounceMs = 100,
}: UseLandmarkCurvatureOptions): UseLandmarkCurvatureReturn {
  const [result, setResult] = useState<LandmarkCurvatureResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastInputHashRef = useRef<string>("");

  const computeCurvature = useCallback(() => {
    if (!enabled || centerline.length < 8 || contourPoints.length < 20) {
      setResult(null);
      return;
    }

    setIsProcessing(true);

    try {
      const rawResult = estimateCurvatureFromLandmarks(
        centerline,
        contourPoints,
        imageWidth,
        imageHeight,
      );

      // Scale landmark positions back to original image coordinates
      const scaledResult: LandmarkCurvatureResult = {
        ...rawResult,
        landmarks: rawResult.landmarks.map(lm => ({
          ...lm,
          position: {
            x: lm.position.x * invScale,
            y: lm.position.y * invScale,
          },
        })),
        hingePoint: rawResult.hingePoint
          ? {
              x: rawResult.hingePoint.x * invScale,
              y: rawResult.hingePoint.y * invScale,
            }
          : undefined,
      };

      // Only update if confidence meets threshold
      if (scaledResult.confidence >= minConfidence) {
        setResult(scaledResult);
        setLastUpdated(Date.now());
      } else {
        setResult(null);
      }
    } catch (error) {
      console.error("[useLandmarkCurvature] Detection error:", error);
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  }, [enabled, centerline, contourPoints, imageWidth, imageHeight, invScale, minConfidence]);

  // Debounced effect for input changes
  useEffect(() => {
    if (!enabled) {
      setResult(null);
      return;
    }

    // Create a simple hash of inputs to detect changes
    const inputHash = `${centerline.length}-${contourPoints.length}-${imageWidth}-${imageHeight}`;

    if (inputHash === lastInputHashRef.current) {
      return; // No change
    }
    lastInputHashRef.current = inputHash;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the computation
    timeoutRef.current = setTimeout(() => {
      computeCurvature();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    enabled,
    centerline.length,
    contourPoints.length,
    imageWidth,
    imageHeight,
    debounceMs,
    computeCurvature,
  ]);

  const refresh = useCallback(() => {
    lastInputHashRef.current = ""; // Force recomputation
    computeCurvature();
  }, [computeCurvature]);

  return {
    result,
    isProcessing,
    lastUpdated,
    refresh,
  };
}
