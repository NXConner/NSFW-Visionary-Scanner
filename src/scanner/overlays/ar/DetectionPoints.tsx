/**
 * DetectionPoints
 * Shows detected landmarks/points being tracked in the AR overlay
 */

import * as React from "react";
import { motion } from "framer-motion";
import type { DetectionLandmark } from "@/lib/ar/measurementCalculations";

export interface DetectionPointsProps {
  /** Array of detected landmarks */
  landmarks: DetectionLandmark[];
  /** Status color for points */
  statusColor?: string;
  /** Show labels for each point */
  showLabels?: boolean;
  /** Point size */
  pointSize?: number;
  /** Show confidence rings */
  showConfidenceRings?: boolean;
  /** Show connections between points */
  showConnections?: boolean;
}

export function DetectionPoints({
  landmarks,
  statusColor = "#38bdf8",
  showLabels = false,
  pointSize = 6,
  showConfidenceRings = true,
  showConnections = true,
}: DetectionPointsProps) {
  // Get color based on landmark type
  const getPointColor = (landmark: DetectionLandmark): string => {
    switch (landmark.type) {
      case "reference":
        return "#f472b6"; // pink-400
      case "measurement":
        return "#38bdf8"; // sky-400
      case "anchor":
        return "#a78bfa"; // violet-400
      default:
        return statusColor;
    }
  };

  // Get opacity based on confidence
  const getConfidenceOpacity = (confidence: number): number => {
    return Math.max(0.3, Math.min(1, confidence));
  };

  // Create connections between measurement points
  const connections: Array<{ from: DetectionLandmark; to: DetectionLandmark }> = [];
  if (showConnections) {
    const measurementPoints = landmarks.filter(l => l.type === "measurement");
    for (let i = 0; i < measurementPoints.length - 1; i += 2) {
      if (measurementPoints[i] && measurementPoints[i + 1]) {
        connections.push({
          from: measurementPoints[i],
          to: measurementPoints[i + 1],
        });
      }
    }
  }

  return (
    <g className="detection-points">
      {/* Connection lines between measurement points */}
      {showConnections &&
        connections.map((conn, index) => (
          <motion.line
            key={`connection-${index}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ duration: 0.3 }}
            x1={conn.from.point.x}
            y1={conn.from.point.y}
            x2={conn.to.point.x}
            y2={conn.to.point.y}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        ))}

      {/* Individual detection points */}
      {landmarks.map((landmark, index) => {
        const color = getPointColor(landmark);
        const opacity = getConfidenceOpacity(landmark.confidence);
        const ringSize = pointSize + 6 + (1 - landmark.confidence) * 8;

        return (
          <g key={landmark.id || index} className="detection-point">
            {/* Confidence ring (pulsing) */}
            {showConfidenceRings && (
              <motion.circle
                cx={landmark.point.x}
                cy={landmark.point.y}
                r={ringSize}
                fill="none"
                stroke={color}
                strokeWidth="1"
                opacity={opacity * 0.5}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [opacity * 0.3, opacity * 0.6, opacity * 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.1,
                }}
              />
            )}

            {/* Outer ring (static) */}
            <circle
              cx={landmark.point.x}
              cy={landmark.point.y}
              r={pointSize + 2}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              opacity={opacity * 0.7}
            />

            {/* Inner point */}
            <motion.circle
              cx={landmark.point.x}
              cy={landmark.point.y}
              r={pointSize}
              fill={color}
              opacity={opacity}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 25,
                delay: index * 0.05,
              }}
              filter="url(#ar-glow)"
            />

            {/* Center dot */}
            <circle
              cx={landmark.point.x}
              cy={landmark.point.y}
              r={2}
              fill="white"
              opacity={opacity}
            />

            {/* Label */}
            {showLabels && (
              <g transform={`translate(${landmark.point.x + pointSize + 8}, ${landmark.point.y})`}>
                {/* Label background */}
                <rect x="-2" y="-10" width="60" height="20" rx="3" fill="rgba(0,0,0,0.75)" />

                {/* Label text */}
                <text x="0" y="4" fill="white" fontSize="10" fontFamily="system-ui, sans-serif">
                  <tspan fill={color}>{landmark.type[0].toUpperCase()}</tspan>
                  <tspan fill="rgba(255,255,255,0.7)">
                    {" "}
                    {Math.round(landmark.confidence * 100)}%
                  </tspan>
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Point type legend (shown when labels are off) */}
      {!showLabels && landmarks.length > 0 && (
        <g transform="translate(10, 10)" className="point-legend">
          <rect x="0" y="0" width="90" height="50" rx="4" fill="rgba(0,0,0,0.6)" />

          {/* Reference point */}
          <circle cx="12" cy="14" r="4" fill="#f472b6" />
          <text x="22" y="18" fill="white" fontSize="9" fontFamily="system-ui, sans-serif">
            Reference
          </text>

          {/* Measurement point */}
          <circle cx="12" cy="30" r="4" fill="#38bdf8" />
          <text x="22" y="34" fill="white" fontSize="9" fontFamily="system-ui, sans-serif">
            Measure
          </text>

          {/* Anchor point */}
          <circle cx="12" cy="46" r="4" fill="#a78bfa" />
          <text x="22" y="50" fill="white" fontSize="9" fontFamily="system-ui, sans-serif">
            Anchor
          </text>
        </g>
      )}
    </g>
  );
}

export default DetectionPoints;
