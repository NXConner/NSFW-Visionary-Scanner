/**
 * ARMeasurementOverlay
 * Main AR overlay component that combines all measurement visualization elements
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/settings';
import { useARMeasurement, type UseARMeasurementReturn } from '@/hooks/useARMeasurement';
import { MeasurementGuides } from './MeasurementGuides';
import { DetectionPoints } from './DetectionPoints';
import { CaptureQualityIndicator } from './CaptureQualityIndicator';
import { PositioningPrompts } from './PositioningPrompts';
import type { DetectionLandmark } from '@/lib/ar/measurementCalculations';

export interface ARMeasurementOverlayProps {
  /** Whether the AR overlay is enabled */
  enabled?: boolean;
  /** Container width */
  width?: number;
  /** Container height */
  height?: number;
  /** External AR measurement hook (optional - will create internal if not provided) */
  arMeasurement?: UseARMeasurementReturn;
  /** Detection landmarks from external source */
  landmarks?: DetectionLandmark[];
  /** Brightness data for quality assessment */
  brightnessData?: number[];
  /** Callback when capture is ready */
  onCaptureReady?: () => void;
  /** Callback when quality changes */
  onQualityChange?: (quality: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Children to render within the overlay */
  children?: React.ReactNode;
}

export function ARMeasurementOverlay({
  enabled = true,
  width = 400,
  height = 600,
  arMeasurement: externalArMeasurement,
  landmarks: externalLandmarks,
  brightnessData,
  onCaptureReady,
  onQualityChange,
  className,
  children,
}: ARMeasurementOverlayProps) {
  // Get AR settings from context
  const settingsContext = useSettings();
  const arSettings = settingsContext?.arOverlay;
  
  // Use external or internal AR measurement
  const internalArMeasurement = useARMeasurement({
    targetBounds: { x: width * 0.1, y: height * 0.1, width: width * 0.8, height: height * 0.8 },
    onCaptureReady,
    onQualityChange: (quality) => onQualityChange?.(quality.overall),
  });
  
  const arMeasurement = externalArMeasurement ?? internalArMeasurement;
  
  // Start/stop based on enabled state
  React.useEffect(() => {
    if (enabled && !arMeasurement.isActive) {
      arMeasurement.start();
    } else if (!enabled && arMeasurement.isActive) {
      arMeasurement.stop();
    }
  }, [enabled, arMeasurement]);
  
  // Update landmarks when external landmarks change
  React.useEffect(() => {
    if (externalLandmarks && arMeasurement.isActive) {
      arMeasurement.updateLandmarks(externalLandmarks, brightnessData);
    }
  }, [externalLandmarks, brightnessData, arMeasurement]);
  
  // Get status color
  const statusColor = arMeasurement.getStatusColor(arMeasurement.positionFeedback.status);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ width, height }}
    >
      {/* Background layer for children (camera feed, etc.) */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>
      
      {/* AR Overlay Layer */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 pointer-events-none"
        >
          {/* SVG Overlay for guides and measurement lines */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="ar-guide-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.8" />
              </linearGradient>
              <filter id="ar-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="status-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={statusColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor={statusColor} stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Measurement Guides */}
            {arSettings?.showGuides !== false && (
              <MeasurementGuides
                width={width}
                height={height}
                measurementLines={arMeasurement.measurementLines}
                statusColor={statusColor}
              />
            )}
            
            {/* Detection Points */}
            {arSettings?.showDetectionPoints !== false && (
              <DetectionPoints
                landmarks={arMeasurement.landmarks}
                statusColor={statusColor}
                showLabels={arSettings?.feedbackStyle === 'detailed'}
              />
            )}
          </svg>
          
          {/* Quality Indicator */}
          {arSettings?.showQualityIndicator !== false && (
            <div className="absolute top-4 right-4 pointer-events-auto">
              <CaptureQualityIndicator
                quality={arMeasurement.qualityMetrics}
                isStable={arMeasurement.isStable}
                captureReady={arMeasurement.captureReady}
                compact={arSettings?.feedbackStyle === 'minimal'}
              />
            </div>
          )}
          
          {/* Positioning Prompts */}
          {arSettings?.showPositioningPrompts !== false && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
              <PositioningPrompts
                feedback={arMeasurement.positionFeedback}
                isStable={arMeasurement.isStable}
                captureReady={arMeasurement.captureReady}
              />
            </div>
          )}
          
          {/* Status Border Glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none border-4 rounded-lg"
            animate={{
              borderColor: statusColor,
              boxShadow: arMeasurement.captureReady 
                ? `0 0 20px ${statusColor}40, inset 0 0 20px ${statusColor}20`
                : `0 0 10px ${statusColor}20`,
            }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Capture Ready Pulse */}
          {arMeasurement.captureReady && (
            <motion.div
              className="absolute inset-0 pointer-events-none border-4 rounded-lg"
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ 
                opacity: [0.8, 0, 0.8], 
                scale: [1, 1.02, 1],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              style={{ borderColor: '#22c55e' }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default ARMeasurementOverlay;
