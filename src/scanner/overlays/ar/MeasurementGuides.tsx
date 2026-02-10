/**
 * MeasurementGuides
 * Visual measurement guides and reference lines for AR overlay
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import type { MeasurementLine } from '@/lib/ar/measurementCalculations';

export interface MeasurementGuidesProps {
  /** Container width */
  width: number;
  /** Container height */
  height: number;
  /** Measurement lines to display */
  measurementLines?: MeasurementLine[];
  /** Status color for guides */
  statusColor?: string;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show center crosshair */
  showCrosshair?: boolean;
  /** Show safe zone boundaries */
  showSafeZone?: boolean;
}

export function MeasurementGuides({
  width,
  height,
  measurementLines = [],
  statusColor = '#38bdf8',
  showGrid = true,
  showCrosshair = true,
  showSafeZone = true,
}: MeasurementGuidesProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const safeZonePadding = Math.min(width, height) * 0.1;
  
  return (
    <g className="measurement-guides">
      {/* Background Vignette */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="url(#vignette-gradient)"
        opacity="0.15"
      />
      
      {/* Safe Zone */}
      {showSafeZone && (
        <>
          {/* Corner brackets */}
          <g stroke="url(#ar-guide-gradient)" strokeWidth="2" fill="none" filter="url(#ar-glow)">
            {/* Top-left corner */}
            <path d={`M ${safeZonePadding} ${safeZonePadding + 30} L ${safeZonePadding} ${safeZonePadding} L ${safeZonePadding + 30} ${safeZonePadding}`} />
            
            {/* Top-right corner */}
            <path d={`M ${width - safeZonePadding - 30} ${safeZonePadding} L ${width - safeZonePadding} ${safeZonePadding} L ${width - safeZonePadding} ${safeZonePadding + 30}`} />
            
            {/* Bottom-left corner */}
            <path d={`M ${safeZonePadding} ${height - safeZonePadding - 30} L ${safeZonePadding} ${height - safeZonePadding} L ${safeZonePadding + 30} ${height - safeZonePadding}`} />
            
            {/* Bottom-right corner */}
            <path d={`M ${width - safeZonePadding - 30} ${height - safeZonePadding} L ${width - safeZonePadding} ${height - safeZonePadding} L ${width - safeZonePadding} ${height - safeZonePadding - 30}`} />
          </g>
          
          {/* Safe zone border (dashed) */}
          <rect
            x={safeZonePadding}
            y={safeZonePadding}
            width={width - safeZonePadding * 2}
            height={height - safeZonePadding * 2}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="8 4"
          />
        </>
      )}
      
      {/* Grid Lines */}
      {showGrid && (
        <g stroke="rgba(255,255,255,0.08)" strokeWidth="0.5">
          {/* Vertical grid lines (rule of thirds) */}
          <line x1={width / 3} y1="0" x2={width / 3} y2={height} />
          <line x1={(width / 3) * 2} y1="0" x2={(width / 3) * 2} y2={height} />
          
          {/* Horizontal grid lines (rule of thirds) */}
          <line x1="0" y1={height / 3} x2={width} y2={height / 3} />
          <line x1="0" y1={(height / 3) * 2} x2={width} y2={(height / 3) * 2} />
        </g>
      )}
      
      {/* Center Crosshair */}
      {showCrosshair && (
        <g stroke={statusColor} strokeWidth="1.5" opacity="0.7" filter="url(#ar-glow)">
          {/* Horizontal line */}
          <line 
            x1={centerX - 25} 
            y1={centerY} 
            x2={centerX - 8} 
            y2={centerY} 
          />
          <line 
            x1={centerX + 8} 
            y1={centerY} 
            x2={centerX + 25} 
            y2={centerY} 
          />
          
          {/* Vertical line */}
          <line 
            x1={centerX} 
            y1={centerY - 25} 
            x2={centerX} 
            y2={centerY - 8} 
          />
          <line 
            x1={centerX} 
            y1={centerY + 8} 
            x2={centerX} 
            y2={centerY + 25} 
          />
          
          {/* Center dot */}
          <circle cx={centerX} cy={centerY} r="3" fill={statusColor} />
        </g>
      )}
      
      {/* Measurement Lines */}
      {measurementLines.map((line, index) => (
        <MeasurementLineComponent
          key={`measurement-${index}`}
          line={line}
          index={index}
        />
      ))}
      
      {/* Scale Reference (bottom) */}
      <g transform={`translate(${safeZonePadding}, ${height - safeZonePadding - 5})`}>
        <line
          x1="0"
          y1="0"
          x2="50"
          y2="0"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
        />
        {/* Tick marks */}
        <line x1="0" y1="-4" x2="0" y2="4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        <line x1="25" y1="-3" x2="25" y2="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <line x1="50" y1="-4" x2="50" y2="4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        
        <text
          x="25"
          y="-8"
          fill="rgba(255,255,255,0.7)"
          fontSize="10"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          REF
        </text>
      </g>
    </g>
  );
}

// Separate component for measurement line with animation
function MeasurementLineComponent({ line, index }: { line: MeasurementLine; index: number }) {
  const midX = (line.start.x + line.end.x) / 2;
  const midY = (line.start.y + line.end.y) / 2;
  
  // Calculate angle for label rotation
  const angle = Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) * (180 / Math.PI);
  const labelRotation = angle > 90 || angle < -90 ? angle + 180 : angle;
  
  // Color based on confidence
  const confidenceColor = line.confidence >= 0.8 
    ? '#22c55e' 
    : line.confidence >= 0.5 
      ? '#eab308' 
      : '#ef4444';
  
  return (
    <g className="measurement-line">
      {/* Line shadow */}
      <line
        x1={line.start.x}
        y1={line.start.y}
        x2={line.end.x}
        y2={line.end.y}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Main measurement line */}
      <motion.line
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        x1={line.start.x}
        y1={line.start.y}
        x2={line.end.x}
        y2={line.end.y}
        stroke={confidenceColor}
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#ar-glow)"
      />
      
      {/* End points */}
      <circle cx={line.start.x} cy={line.start.y} r="4" fill={confidenceColor} />
      <circle cx={line.end.x} cy={line.end.y} r="4" fill={confidenceColor} />
      
      {/* Measurement label background */}
      <rect
        x={midX - 25}
        y={midY - 10}
        width="50"
        height="20"
        rx="4"
        fill="rgba(0,0,0,0.7)"
        transform={`rotate(${labelRotation}, ${midX}, ${midY})`}
      />
      
      {/* Measurement label text */}
      <text
        x={midX}
        y={midY + 4}
        fill="white"
        fontSize="12"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        transform={`rotate(${labelRotation}, ${midX}, ${midY})`}
      >
        {line.distance.toFixed(1)}{line.unit}
      </text>
    </g>
  );
}

export default MeasurementGuides;
