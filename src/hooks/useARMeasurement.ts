/**
 * useARMeasurement Hook
 * Manages AR measurement state and calculations for the scanner overlay
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  DetectionLandmark,
  MeasurementLine,
  QualityMetrics,
  PositionFeedback,
  Point2D,
  BoundingBox,
  calculateOverallQuality,
  assessLightingQuality,
  assessStability,
  assessAngleQuality,
  generatePositionFeedback,
  generateMeasurementLines,
  filterLandmarks,
  getPositionStatus,
  calculateCentroid,
} from "@/lib/ar/measurementCalculations";
import { useSettings } from "@/contexts/settings";
import type { AROverlaySensitivity } from "@/contexts/settings/types";

export interface ARMeasurementState {
  isActive: boolean;
  landmarks: DetectionLandmark[];
  measurementLines: MeasurementLine[];
  qualityMetrics: QualityMetrics;
  positionFeedback: PositionFeedback;
  isStable: boolean;
  captureReady: boolean;
  lastUpdateTime: number;
}

export interface UseARMeasurementOptions {
  targetBounds?: BoundingBox;
  referencePixels?: number;
  referenceRealWorld?: number;
  measurementUnit?: "mm" | "cm" | "in";
  onCaptureReady?: () => void;
  onQualityChange?: (quality: QualityMetrics) => void;
}

const DEFAULT_TARGET_BOUNDS: BoundingBox = {
  x: 100,
  y: 100,
  width: 300,
  height: 400,
};

const SENSITIVITY_THRESHOLDS: Record<AROverlaySensitivity, { stability: number; quality: number }> =
  {
    low: { stability: 50, quality: 50 },
    medium: { stability: 70, quality: 65 },
    high: { stability: 85, quality: 80 },
  };

const DEFAULT_QUALITY_METRICS: QualityMetrics = {
  overall: 0,
  lighting: 50,
  stability: 50,
  angle: 50,
  distance: 50,
  focus: 50,
};

const DEFAULT_POSITION_FEEDBACK: PositionFeedback = {
  status: "adjust",
  message: "Position your device...",
  adjustments: {},
};

export function useARMeasurement(options: UseARMeasurementOptions = {}) {
  const {
    targetBounds = DEFAULT_TARGET_BOUNDS,
    referencePixels = 100,
    referenceRealWorld = 50,
    measurementUnit = "mm",
    onCaptureReady,
    onQualityChange,
  } = options;

  // Get AR settings from context
  const settingsContext = useSettings();
  const arSettings = settingsContext?.arOverlay;
  const sensitivity = arSettings?.sensitivity ?? "medium";
  const thresholds = SENSITIVITY_THRESHOLDS[sensitivity];

  // State
  const [state, setState] = useState<ARMeasurementState>({
    isActive: false,
    landmarks: [],
    measurementLines: [],
    qualityMetrics: DEFAULT_QUALITY_METRICS,
    positionFeedback: DEFAULT_POSITION_FEEDBACK,
    isStable: false,
    captureReady: false,
    lastUpdateTime: Date.now(),
  });

  // Refs for tracking
  const previousLandmarksRef = useRef<DetectionLandmark[]>([]);
  const previousPointsRef = useRef<Point2D[]>([]);
  const stabilityCountRef = useRef(0);
  const frameCountRef = useRef(0);
  const captureReadyCalledRef = useRef(false);
  const orientationRef = useRef<{ beta: number | null; gamma: number | null; updatedAt: number }>({
    beta: null,
    gamma: null,
    updatedAt: 0,
  });

  // Get smoothing factor based on sensitivity
  const smoothingFactor = useMemo(() => {
    switch (sensitivity) {
      case "low":
        return 0.5;
      case "high":
        return 0.15;
      default:
        return 0.3;
    }
  }, [sensitivity]);

  // Best-effort device orientation capture (for angle quality).
  // - On some platforms (notably iOS), this may require a user gesture + permission.
  // - If we cannot observe orientation, we treat angle quality as "not blocking" (100).
  useEffect(() => {
    if (!state.isActive) return;

    const handler = (ev: DeviceOrientationEvent) => {
      const beta = typeof ev.beta === "number" ? ev.beta : null;
      const gamma = typeof ev.gamma === "number" ? ev.gamma : null;
      if (beta === null && gamma === null) return;
      orientationRef.current = { beta, gamma, updatedAt: Date.now() };
    };

    try {
      window.addEventListener("deviceorientation", handler, { passive: true });
    } catch {
      // ignore
    }

    return () => {
      try {
        window.removeEventListener("deviceorientation", handler as any);
      } catch {
        // ignore
      }
    };
  }, [state.isActive]);

  // Start AR measurement
  const start = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
    previousLandmarksRef.current = [];
    previousPointsRef.current = [];
    stabilityCountRef.current = 0;
    frameCountRef.current = 0;
    captureReadyCalledRef.current = false;
  }, []);

  // Stop AR measurement
  const stop = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      captureReady: false,
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isActive: false,
      landmarks: [],
      measurementLines: [],
      qualityMetrics: DEFAULT_QUALITY_METRICS,
      positionFeedback: DEFAULT_POSITION_FEEDBACK,
      isStable: false,
      captureReady: false,
      lastUpdateTime: Date.now(),
    });
    previousLandmarksRef.current = [];
    previousPointsRef.current = [];
    stabilityCountRef.current = 0;
    captureReadyCalledRef.current = false;
  }, []);

  // Update landmarks from detection
  const updateLandmarks = useCallback(
    (newLandmarks: DetectionLandmark[], brightnessData?: number[]) => {
      if (!state.isActive) return;

      frameCountRef.current++;

      // Apply filtering/smoothing
      const filteredLandmarks = filterLandmarks(
        newLandmarks,
        previousLandmarksRef.current,
        smoothingFactor,
      );

      // Calculate current bounding box from landmarks
      const currentPoints = filteredLandmarks.map(l => l.point);
      const centroid = calculateCentroid(filteredLandmarks);

      let currentBounds: BoundingBox = targetBounds;
      if (currentPoints.length >= 2) {
        const minX = Math.min(...currentPoints.map(p => p.x));
        const maxX = Math.max(...currentPoints.map(p => p.x));
        const minY = Math.min(...currentPoints.map(p => p.y));
        const maxY = Math.max(...currentPoints.map(p => p.y));
        currentBounds = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };
      }

      // Assess quality metrics
      const lighting = assessLightingQuality(brightnessData ?? [128]);
      const stability = assessStability(previousPointsRef.current, currentPoints);
      const angle = (() => {
        const snap = orientationRef.current;
        const ageMs = Date.now() - (snap.updatedAt || 0);
        if (ageMs > 2500) return 100;

        const beta = snap.beta;
        const gamma = snap.gamma;

        // Prefer a "roll-like" value that stays near 0 in typical upright portrait use.
        // Use screen orientation to decide which axis best represents roll.
        let screenAngle: number | null = null;
        try {
          const raw =
            (window.screen as any)?.orientation?.angle ?? (window as any).orientation ?? null;
          screenAngle = typeof raw === "number" ? raw : null;
        } catch {
          screenAngle = null;
        }

        const useBetaAsRoll = screenAngle === 90 || screenAngle === -90 || screenAngle === 270;
        const rollDeg = useBetaAsRoll ? beta : gamma;
        if (typeof rollDeg !== "number" || Number.isNaN(rollDeg)) return 100;
        return assessAngleQuality(rollDeg, 0, 15);
      })();
      const distance = Math.min(
        100,
        Math.max(
          0,
          100 -
            Math.abs(
              ((currentBounds.width * currentBounds.height) /
                (targetBounds.width * targetBounds.height)) *
                100 -
                100,
            ),
        ),
      );
      const focus =
        filteredLandmarks.length > 0
          ? Math.round(
              (filteredLandmarks.reduce((sum, l) => sum + l.confidence, 0) /
                filteredLandmarks.length) *
                100,
            )
          : 50;

      const qualityMetrics = calculateOverallQuality({
        lighting,
        stability,
        angle,
        distance,
        focus,
      });

      // Generate position feedback
      const positionFeedback = generatePositionFeedback(
        filteredLandmarks,
        targetBounds,
        currentBounds,
      );

      // Generate measurement lines
      const measurementLines = generateMeasurementLines(
        filteredLandmarks,
        referencePixels,
        referenceRealWorld,
        measurementUnit,
      );

      // Check stability
      const isCurrentlyStable = stability >= thresholds.stability;
      if (isCurrentlyStable) {
        stabilityCountRef.current++;
      } else {
        stabilityCountRef.current = Math.max(0, stabilityCountRef.current - 1);
      }

      // Need consistent stability over multiple frames
      const isStable = stabilityCountRef.current >= 5;

      // Check if capture ready
      const captureReady =
        isStable &&
        qualityMetrics.overall >= thresholds.quality &&
        positionFeedback.status === "good";

      // Update refs for next frame
      previousLandmarksRef.current = filteredLandmarks;
      previousPointsRef.current = currentPoints;

      // Call capture ready callback once
      if (captureReady && !captureReadyCalledRef.current) {
        captureReadyCalledRef.current = true;
        onCaptureReady?.();
      } else if (!captureReady) {
        captureReadyCalledRef.current = false;
      }

      // Notify quality change
      onQualityChange?.(qualityMetrics);

      setState(prev => ({
        ...prev,
        landmarks: filteredLandmarks,
        measurementLines,
        qualityMetrics,
        positionFeedback,
        isStable,
        captureReady,
        lastUpdateTime: Date.now(),
      }));
    },
    [
      state.isActive,
      smoothingFactor,
      targetBounds,
      referencePixels,
      referenceRealWorld,
      measurementUnit,
      thresholds,
      onCaptureReady,
      onQualityChange,
    ],
  );

  // Manually set capture ready state
  const setCaptureReady = useCallback((ready: boolean) => {
    setState(prev => ({ ...prev, captureReady: ready }));
  }, []);

  // Get color for position status
  const getStatusColor = useCallback((status: "good" | "adjust" | "poor") => {
    switch (status) {
      case "good":
        return "#22c55e"; // green-500
      case "adjust":
        return "#eab308"; // yellow-500
      case "poor":
        return "#ef4444"; // red-500
    }
  }, []);

  return {
    // State
    ...state,

    // Actions
    start,
    stop,
    reset,
    updateLandmarks,
    setCaptureReady,

    // Utilities
    getStatusColor,
    sensitivity,
    thresholds,
  };
}

export type UseARMeasurementReturn = ReturnType<typeof useARMeasurement>;
