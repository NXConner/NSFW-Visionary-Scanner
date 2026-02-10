/**
 * CaptureQualityIndicator
 * Shows capture quality score and individual metrics
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Camera, Sun, Activity, Crosshair, Maximize2, Focus } from 'lucide-react';
import type { QualityMetrics } from '@/lib/ar/measurementCalculations';

export interface CaptureQualityIndicatorProps {
  /** Quality metrics */
  quality: QualityMetrics;
  /** Whether position is stable */
  isStable?: boolean;
  /** Whether capture is ready */
  captureReady?: boolean;
  /** Compact mode (just overall score) */
  compact?: boolean;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function CaptureQualityIndicator({
  quality,
  isStable = false,
  captureReady = false,
  compact = false,
  showDetails: initialShowDetails = false,
  className,
}: CaptureQualityIndicatorProps) {
  const [showDetails, setShowDetails] = React.useState(initialShowDetails);
  
  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 75) return '#22c55e'; // green
    if (score >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };
  
  // Get background gradient based on overall quality
  const getGradient = (): string => {
    const color = getScoreColor(quality.overall);
    return `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`;
  };
  
  // Quality metric items
  const metrics = [
    { key: 'lighting', label: 'Lighting', icon: Sun, value: quality.lighting },
    { key: 'stability', label: 'Stability', icon: Activity, value: quality.stability },
    { key: 'angle', label: 'Angle', icon: Crosshair, value: quality.angle },
    { key: 'distance', label: 'Distance', icon: Maximize2, value: quality.distance },
    { key: 'focus', label: 'Focus', icon: Focus, value: quality.focus },
  ];

  if (compact) {
    return (
      <motion.div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-full',
          'bg-black/60 backdrop-blur-sm border border-white/10',
          className
        )}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <motion.div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: getScoreColor(quality.overall) }}
          animate={{ scale: captureReady ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5, repeat: captureReady ? Infinity : 0 }}
        >
          {quality.overall}
        </motion.div>
        
        {captureReady && (
          <motion.span
            className="text-green-400 text-xs font-medium"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Ready!
          </motion.span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'rounded-xl overflow-hidden',
        'bg-black/70 backdrop-blur-md border border-white/10',
        'shadow-xl',
        className
      )}
      initial={{ scale: 0.9, opacity: 0, y: -10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Header with overall score */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        style={{ background: getGradient() }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: getScoreColor(quality.overall) }}
              animate={{ 
                scale: captureReady ? [1, 1.1, 1] : 1,
                boxShadow: captureReady 
                  ? [`0 0 0 0 ${getScoreColor(quality.overall)}50`, `0 0 0 10px ${getScoreColor(quality.overall)}00`]
                  : '0 0 0 0 transparent',
              }}
              transition={{ duration: 1, repeat: captureReady ? Infinity : 0 }}
            >
              {quality.overall}
            </motion.div>
            
            {/* Circular progress ring */}
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 48 48"
            >
              <circle
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke={getScoreColor(quality.overall)}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${(quality.overall / 100) * 138} 138`}
                initial={{ strokeDasharray: '0 138' }}
                animate={{ strokeDasharray: `${(quality.overall / 100) * 138} 138` }}
                transition={{ duration: 0.5 }}
              />
            </svg>
          </div>
          
          <div className="text-left">
            <div className="text-white font-semibold text-sm">Quality Score</div>
            <div className="text-white/60 text-xs">
              {captureReady ? (
                <span className="text-green-400">✓ Ready to capture</span>
              ) : isStable ? (
                <span className="text-yellow-400">Hold steady...</span>
              ) : (
                <span>Adjusting...</span>
              )}
            </div>
          </div>
        </div>
        
        <Camera 
          className={cn(
            'w-5 h-5 transition-colors',
            captureReady ? 'text-green-400' : 'text-white/40'
          )} 
        />
      </button>
      
      {/* Detailed metrics */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2 border-t border-white/10">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                const color = getScoreColor(metric.value);
                
                return (
                  <div key={metric.key} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-white/50" />
                    <span className="text-xs text-white/70 w-16">{metric.label}</span>
                    
                    {/* Progress bar */}
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value}%` }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      />
                    </div>
                    
                    {/* Value */}
                    <span 
                      className="text-xs font-medium w-8 text-right"
                      style={{ color }}
                    >
                      {metric.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default CaptureQualityIndicator;
