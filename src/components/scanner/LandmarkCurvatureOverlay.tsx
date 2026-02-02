/**
 * Landmark Curvature Overlay Component
 * 
 * Visualizes 4-point landmark detection and curvature angle
 * based on PMC10150132 methodology.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import type { LandmarkCurvatureResult } from "@/scanner/processing/steps/landmarkCurvature";
import { 
  generateCurvatureVisualization, 
  getCurvatureTypeLabel,
  getCurvatureClinicalNote 
} from "@/scanner/processing/steps/curvatureVisualization";

export interface LandmarkCurvatureOverlayProps {
  /** Curvature detection result */
  result: LandmarkCurvatureResult | null;
  /** Whether to show the overlay */
  isActive: boolean;
  /** Container width for scaling */
  containerWidth?: number;
  /** Container height for scaling */
  containerHeight?: number;
  /** Image width (original) */
  imageWidth?: number;
  /** Image height (original) */
  imageHeight?: number;
  /** Show clinical interpretation */
  showClinicalNote?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

const LandmarkMarker = memo(function LandmarkMarker({
  x,
  y,
  size,
  label,
  type,
  delay = 0,
}: {
  x: number;
  y: number;
  size: number;
  label: string;
  type: string;
  delay?: number;
}) {
  const isDistal = type.startsWith("D");
  
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.3, type: "spring" }}
    >
      {/* Outer ring */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill="none"
        stroke={isDistal ? "hsl(var(--primary))" : "hsl(var(--accent))"}
        strokeWidth={2}
        opacity={0.8}
      />
      {/* Inner dot */}
      <circle
        cx={x}
        cy={y}
        r={size * 0.4}
        fill={isDistal ? "hsl(var(--primary))" : "hsl(var(--accent))"}
      />
      {/* Label */}
      {label && (
        <text
          x={x}
          y={y - size - 4}
          textAnchor="middle"
          fontSize={10}
          fill="hsl(var(--foreground))"
          fontFamily="monospace"
          opacity={0.9}
        >
          {type}
        </text>
      )}
    </motion.g>
  );
});

const AxisLine = memo(function AxisLine({
  x1,
  y1,
  x2,
  y2,
  color,
  width,
  label,
  delay = 0,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  label: string;
  delay?: number;
}) {
  return (
    <motion.g
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.7 }}
      transition={{ delay, duration: 0.5 }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeDasharray="6 4"
        opacity={0.7}
      />
      {/* Direction arrow */}
      <polygon
        points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
        fill={color}
        opacity={0.8}
        transform={`rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}, ${x2}, ${y2})`}
      />
    </motion.g>
  );
});

const AngleArc = memo(function AngleArc({
  path,
  color,
  width,
  angleDeg,
  centerX,
  centerY,
}: {
  path: string;
  color: string;
  width: number;
  angleDeg: number;
  centerX: number;
  centerY: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      {/* Arc path */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={width + 1}
        strokeLinecap="round"
      />
      {/* Angle label */}
      <g>
        <rect
          x={centerX - 20}
          y={centerY - 10}
          width={40}
          height={20}
          rx={4}
          fill="hsl(var(--background))"
          opacity={0.9}
        />
        <text
          x={centerX}
          y={centerY + 4}
          textAnchor="middle"
          fontSize={12}
          fontWeight="bold"
          fill={color}
          fontFamily="monospace"
        >
          {angleDeg.toFixed(1)}°
        </text>
      </g>
    </motion.g>
  );
});

export const LandmarkCurvatureOverlay = memo(function LandmarkCurvatureOverlay({
  result,
  isActive,
  containerWidth = 400,
  containerHeight = 300,
  imageWidth = 400,
  imageHeight = 300,
  showClinicalNote = false,
  compact = false,
}: LandmarkCurvatureOverlayProps) {
  // Calculate scale factors for coordinate transformation
  const scaleX = containerWidth / imageWidth;
  const scaleY = containerHeight / imageHeight;
  
  const visualization = useMemo(() => {
    if (!result) return null;
    return generateCurvatureVisualization(result, {
      markerSize: compact ? 6 : 8,
      lineWidth: compact ? 1.5 : 2,
      showLabels: !compact,
    });
  }, [result, compact]);

  const clinicalNote = useMemo(() => {
    if (!result || !showClinicalNote) return null;
    return getCurvatureClinicalNote(result);
  }, [result, showClinicalNote]);

  if (!isActive || !result || !visualization) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <svg 
        width={containerWidth} 
        height={containerHeight}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        {/* Axis lines */}
        {visualization.axisLines.map((line, idx) => (
          <AxisLine
            key={`axis-${idx}`}
            x1={line.start.x * scaleX}
            y1={line.start.y * scaleY}
            x2={line.end.x * scaleX}
            y2={line.end.y * scaleY}
            color={line.color}
            width={line.width}
            label={line.label}
            delay={idx * 0.1}
          />
        ))}

        {/* Angle arc */}
        {visualization.angleArc && (
          <AngleArc
            path={visualization.angleArc.path}
            color={visualization.angleArc.color}
            width={visualization.angleArc.width}
            angleDeg={visualization.angleArc.angleDeg}
            centerX={visualization.angleArc.center.x * scaleX}
            centerY={visualization.angleArc.center.y * scaleY}
          />
        )}

        {/* Hinge point indicator */}
        {visualization.hingePoint && (
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <circle
              cx={visualization.hingePoint.position.x * scaleX}
              cy={visualization.hingePoint.position.y * scaleY}
              r={visualization.hingePoint.size}
              fill="none"
              stroke={visualization.hingePoint.color}
              strokeWidth={3}
              strokeDasharray="4 2"
            />
            <text
              x={visualization.hingePoint.position.x * scaleX}
              y={visualization.hingePoint.position.y * scaleY - visualization.hingePoint.size - 6}
              textAnchor="middle"
              fontSize={9}
              fill={visualization.hingePoint.color}
              fontFamily="monospace"
            >
              HINGE
            </text>
          </motion.g>
        )}

        {/* Landmark markers */}
        {visualization.landmarks.map((lm, idx) => (
          <LandmarkMarker
            key={`landmark-${lm.type}`}
            x={lm.position.x * scaleX}
            y={lm.position.y * scaleY}
            size={lm.size}
            label={lm.label}
            type={lm.type}
            delay={0.2 + idx * 0.08}
          />
        ))}
      </svg>

      {/* Info panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`absolute ${compact ? "bottom-2 left-2" : "bottom-4 left-4"} 
          bg-background/90 backdrop-blur-sm rounded-lg border border-border/50
          ${compact ? "p-2" : "p-3"} max-w-xs`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div 
            className={`${compact ? "w-2 h-2" : "w-3 h-3"} rounded-full`}
            style={{ 
              backgroundColor: result.confidence > 0.7 
                ? "hsl(var(--primary))" 
                : "hsl(45, 100%, 50%)" 
            }}
          />
          <span className={`font-semibold ${compact ? "text-xs" : "text-sm"}`}>
            {getCurvatureTypeLabel(result.curvatureType)}
          </span>
        </div>
        
        <div className={`${compact ? "text-[10px]" : "text-xs"} text-muted-foreground space-y-0.5`}>
          <div className="flex justify-between gap-4">
            <span>Angle:</span>
            <span className="font-mono font-medium text-foreground">
              {result.angleDeg.toFixed(1)}°
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Direction:</span>
            <span className="font-mono capitalize text-foreground">
              {result.direction}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Confidence:</span>
            <span className="font-mono text-foreground">
              {Math.round(result.confidence * 100)}%
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Method:</span>
            <span className="font-mono text-foreground text-[9px]">
              {result.method === "4-point-landmark" ? "4-Point" : "Fallback"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Clinical note */}
      {clinicalNote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute top-4 left-4 right-4 bg-muted/80 backdrop-blur-sm 
            rounded-lg p-3 border border-border/50"
        >
          <p className="text-xs text-muted-foreground">
            {clinicalNote}
          </p>
        </motion.div>
      )}
    </div>
  );
});

LandmarkCurvatureOverlay.displayName = "LandmarkCurvatureOverlay";
