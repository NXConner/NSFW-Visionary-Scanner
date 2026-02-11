import { memo, useEffect, useMemo, useCallback } from "react";

import type { DetectedObject } from "@/hooks/useObjectDetection";
import { DetectionConfidenceRing } from "@/components/scanner/DetectionConfidenceRing";

export interface ObjectDetectionOverlayProps {
  isActive: boolean;
  detections: DetectedObject[];
  selectedIndex?: number;
  onDetection?: (detected: boolean) => void;
  showMeasurementGuides?: boolean;
  showDetectionConfidence?: boolean;
  /**
   * Pixels per mm (used to estimate mm from the % box).
   * Default is a reasonable approximation until calibration is supplied.
   */
  calibrationScale?: number;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Memoized detection box component to prevent unnecessary re-renders
const DetectionBox = memo(function DetectionBox({
  detection,
  isSelected,
  showMeasurementGuides,
  showDetectionConfidence,
  calibrationScale,
}: {
  detection: DetectedObject;
  isSelected: boolean;
  showMeasurementGuides: boolean;
  showDetectionConfidence: boolean;
  calibrationScale: number;
}) {
  const confidenceColor = useMemo(() => {
    return detection.score > 0.85
      ? "hsl(var(--primary))"
      : detection.score > 0.72
        ? "hsl(45, 100%, 50%)"
        : "hsl(var(--destructive))";
  }, [detection.score]);

  // Memoize measurement calculations
  const measurements = useMemo(() => {
    const lengthMm = Math.round(((detection.box.height / 100) * 400) / calibrationScale);
    const widthMm = Math.round(((detection.box.width / 100) * 300) / calibrationScale);
    const circumferenceMm = Math.round(widthMm * Math.PI);
    return { lengthMm, widthMm, circumferenceMm };
  }, [detection.box.height, detection.box.width, calibrationScale]);

  // Memoize style object to prevent re-renders
  const boxStyle = useMemo(
    () => ({
      left: `${detection.box.x}%`,
      top: `${detection.box.y}%`,
      width: `${detection.box.width}%`,
      height: `${detection.box.height}%`,
      transition:
        "left 90ms ease-out, top 90ms ease-out, width 90ms ease-out, height 90ms ease-out",
      opacity: isSelected ? 1 : 0.65,
    }),
    [detection.box.x, detection.box.y, detection.box.width, detection.box.height, isSelected],
  );

  const corners = useMemo(
    () => [
      { pos: "-top-0.5 -left-0.5", h: "top-0 left-0", v: "top-0 left-0" },
      { pos: "-top-0.5 -right-0.5", h: "top-0 right-0", v: "top-0 right-0" },
      { pos: "-bottom-0.5 -left-0.5", h: "bottom-0 left-0", v: "bottom-0 left-0" },
      { pos: "-bottom-0.5 -right-0.5", h: "bottom-0 right-0", v: "bottom-0 right-0" },
    ],
    [],
  );

  return (
    <div className="absolute will-change-transform" style={boxStyle}>
      {showDetectionConfidence ? (
        <DetectionConfidenceRing confidence={detection.score} className="absolute inset-0" />
      ) : (
        <div
          className="absolute inset-0 rounded-lg border-2"
          style={{ borderColor: confidenceColor, boxShadow: `0 0 12px ${confidenceColor}30` }}
        />
      )}

      {/* Corner highlights */}
      {corners.map((corner, i) => (
        <div key={i} className={`absolute ${corner.pos} w-4 h-4`}>
          <div
            className={`absolute ${corner.h} w-full h-0.5`}
            style={{ background: confidenceColor }}
          />
          <div
            className={`absolute ${corner.v} h-full w-0.5`}
            style={{ background: confidenceColor }}
          />
        </div>
      ))}

      {/* Label */}
      <div
        className="absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-mono"
        style={{
          background: `${confidenceColor}15`,
          color: confidenceColor,
          border: `1px solid ${confidenceColor}30`,
        }}
      >
        {detection.className.toUpperCase()} {Math.round(detection.score * 100)}%
      </div>

      {showMeasurementGuides && (
        <>
          {/* Length indicator (vertical) */}
          <div
            className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap"
            style={{
              background: `${confidenceColor}15`,
              color: confidenceColor,
              border: `1px solid ${confidenceColor}30`,
            }}
          >
            L: {measurements.lengthMm}mm
          </div>
          {/* Circumference indicator (bottom) */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-10 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap"
            style={{
              background: `${confidenceColor}15`,
              color: confidenceColor,
              border: `1px solid ${confidenceColor}30`,
            }}
          >
            C: {measurements.circumferenceMm}mm
          </div>
        </>
      )}
    </div>
  );
});

export const ObjectDetectionOverlay = memo(function ObjectDetectionOverlay({
  isActive,
  detections,
  selectedIndex = 0,
  onDetection,
  showMeasurementGuides = true,
  showDetectionConfidence = true,
  calibrationScale = 3.5,
}: ObjectDetectionOverlayProps) {
  const hasDetections = isActive && detections.length > 0;

  // Memoize onDetection callback
  const stableOnDetection = useCallback(
    (detected: boolean) => {
      onDetection?.(detected);
    },
    [onDetection],
  );

  useEffect(() => {
    stableOnDetection(hasDetections);
  }, [hasDetections, stableOnDetection]);

  const safeSelectedIndex = useMemo(() => {
    if (!detections.length) return 0;
    return clamp(selectedIndex, 0, detections.length - 1);
  }, [detections.length, selectedIndex]);

  if (!isActive) return null;

  if (!detections.length) {
    return (
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-primary/20 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {detections.map((d, idx) => (
        <DetectionBox
          key={`${d.id}-${idx}`}
          detection={d}
          isSelected={idx === safeSelectedIndex}
          showMeasurementGuides={showMeasurementGuides}
          showDetectionConfidence={showDetectionConfidence}
          calibrationScale={calibrationScale}
        />
      ))}
    </div>
  );
});

ObjectDetectionOverlay.displayName = "ObjectDetectionOverlay";
