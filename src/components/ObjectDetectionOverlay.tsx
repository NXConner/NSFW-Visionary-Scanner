import { useState, useEffect, useRef, useCallback, memo } from "react";

interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface ObjectDetectionOverlayProps {
  isActive: boolean;
  onDetection?: (detected: boolean) => void;
  showMeasurementGuides?: boolean;
  calibrationScale?: number; // pixels per mm
}

// Memoized measurement tick component for performance
const MeasurementTick = memo(({ 
  position, 
  label, 
  isVertical, 
  color 
}: { 
  position: number; 
  label: string; 
  isVertical: boolean; 
  color: string;
}) => (
  <div
    className="absolute flex items-center gap-0.5"
    style={isVertical ? { top: `${position}%`, left: '-20px' } : { left: `${position}%`, bottom: '-18px' }}
  >
    {isVertical ? (
      <>
        <span className="text-[8px] font-mono" style={{ color }}>{label}</span>
        <div className="w-2 h-px" style={{ background: color }} />
      </>
    ) : (
      <div className="flex flex-col items-center">
        <div className="h-2 w-px" style={{ background: color }} />
        <span className="text-[8px] font-mono" style={{ color }}>{label}</span>
      </div>
    )}
  </div>
));

MeasurementTick.displayName = 'MeasurementTick';

export const ObjectDetectionOverlay = memo(({ 
  isActive, 
  onDetection,
  showMeasurementGuides = true,
  calibrationScale = 3.5 // default ~3.5 px/mm
}: ObjectDetectionOverlayProps) => {
  const [detection, setDetection] = useState<DetectionBox | null>(null);
  const [isDetected, setIsDetected] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const detectionRef = useRef(detection);
  const rafRef = useRef<number>();

  // Stable callback for detection notification
  const notifyDetection = useCallback((detected: boolean) => {
    onDetection?.(detected);
  }, [onDetection]);

  // Optimized tracking with requestAnimationFrame
  useEffect(() => {
    if (!isActive) {
      setDetection(null);
      setIsDetected(false);
      detectionRef.current = null;
      return;
    }

    // Initial detection after brief delay
    const initialDelay = setTimeout(() => {
      const baseBox: DetectionBox = {
        x: 28 + Math.random() * 6,
        y: 18 + Math.random() * 4,
        width: 44 + Math.random() * 6,
        height: 58 + Math.random() * 6,
        confidence: 0.75 + Math.random() * 0.2,
      };
      setDetection(baseBox);
      detectionRef.current = baseBox;
      setIsDetected(true);
      setPulseAnimation(true);
      notifyDetection(true);
      
      setTimeout(() => setPulseAnimation(false), 800);
    }, 600);

    // Optimized tracking with RAF for smooth 60fps updates
    let lastUpdate = 0;
    const updateInterval = 100; // Update every 100ms for performance

    const updateTracking = (timestamp: number) => {
      if (timestamp - lastUpdate >= updateInterval && detectionRef.current) {
        const prev = detectionRef.current;
        const newBox = {
          x: prev.x + (Math.random() - 0.5) * 1.2,
          y: prev.y + (Math.random() - 0.5) * 0.8,
          width: prev.width + (Math.random() - 0.5) * 0.6,
          height: prev.height + (Math.random() - 0.5) * 0.6,
          confidence: Math.max(0.72, Math.min(0.96, prev.confidence + (Math.random() - 0.5) * 0.03)),
        };
        detectionRef.current = newBox;
        setDetection(newBox);
        lastUpdate = timestamp;
      }
      rafRef.current = requestAnimationFrame(updateTracking);
    };

    // Start tracking after detection
    const trackingDelay = setTimeout(() => {
      rafRef.current = requestAnimationFrame(updateTracking);
    }, 700);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(trackingDelay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, notifyDetection]);

  if (!isActive || !detection) return null;

  const confidenceColor = detection.confidence > 0.85 
    ? 'hsl(var(--primary))' 
    : detection.confidence > 0.72 
      ? 'hsl(45, 100%, 50%)' 
      : 'hsl(0, 100%, 60%)';

  // Calculate measurements based on detection box and calibration
  const heightMm = Math.round((detection.height / 100) * 400 / calibrationScale);
  const widthMm = Math.round((detection.width / 100) * 300 / calibrationScale);
  
  // Generate measurement ticks
  const verticalTicks = showMeasurementGuides ? [0, 25, 50, 75, 100] : [];
  const horizontalTicks = showMeasurementGuides ? [0, 25, 50, 75, 100] : [];

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Detection bounding box with GPU-accelerated transforms */}
      <div
        className={`absolute will-change-transform ${pulseAnimation ? 'animate-pulse' : ''}`}
        style={{
          left: `${detection.x}%`,
          top: `${detection.y}%`,
          width: `${detection.width}%`,
          height: `${detection.height}%`,
          transition: 'left 80ms ease-out, top 80ms ease-out, width 80ms ease-out, height 80ms ease-out',
        }}
      >
        {/* Main outline with glow effect */}
        <div 
          className="absolute inset-0 rounded-lg border-2"
          style={{ 
            borderColor: confidenceColor,
            boxShadow: `0 0 12px ${confidenceColor}30`,
          }}
        />
        
        {/* Corner highlights - simplified for performance */}
        {[
          { pos: '-top-0.5 -left-0.5', h: 'top-0 left-0', v: 'top-0 left-0' },
          { pos: '-top-0.5 -right-0.5', h: 'top-0 right-0', v: 'top-0 right-0' },
          { pos: '-bottom-0.5 -left-0.5', h: 'bottom-0 left-0', v: 'bottom-0 left-0' },
          { pos: '-bottom-0.5 -right-0.5', h: 'bottom-0 right-0', v: 'bottom-0 right-0' },
        ].map((corner, i) => (
          <div key={i} className={`absolute ${corner.pos} w-4 h-4`}>
            <div className={`absolute ${corner.h} w-full h-0.5`} style={{ background: confidenceColor }} />
            <div className={`absolute ${corner.v} h-full w-0.5`} style={{ background: confidenceColor }} />
          </div>
        ))}

        {/* Measurement guides along edges */}
        {showMeasurementGuides && (
          <>
            {/* Vertical measurement ruler (left edge) */}
            <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between">
              {verticalTicks.map((tick, i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <span className="text-[7px] font-mono opacity-80" style={{ color: confidenceColor }}>
                    {Math.round((tick / 100) * heightMm)}
                  </span>
                  <div className={`h-px ${i === 0 || i === 4 ? 'w-3' : 'w-2'}`} style={{ background: confidenceColor, opacity: 0.6 }} />
                </div>
              ))}
            </div>
            
            {/* Horizontal measurement ruler (bottom edge) */}
            <div className="absolute -bottom-5 left-0 right-0 flex justify-between">
              {horizontalTicks.map((tick, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className={`w-px ${i === 0 || i === 4 ? 'h-3' : 'h-2'}`} style={{ background: confidenceColor, opacity: 0.6 }} />
                  <span className="text-[7px] font-mono opacity-80" style={{ color: confidenceColor }}>
                    {Math.round((tick / 100) * widthMm)}
                  </span>
                </div>
              ))}
            </div>

            {/* Dimension labels */}
            <div 
              className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap"
              style={{ background: `${confidenceColor}15`, color: confidenceColor, border: `1px solid ${confidenceColor}30` }}
            >
              {heightMm}mm
            </div>
            <div 
              className="absolute left-1/2 -translate-x-1/2 -bottom-10 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap"
              style={{ background: `${confidenceColor}15`, color: confidenceColor, border: `1px solid ${confidenceColor}30` }}
            >
              {widthMm}mm
            </div>
          </>
        )}

        {/* Center crosshair - simplified */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 opacity-50">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1.5" style={{ background: confidenceColor }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-1.5" style={{ background: confidenceColor }} />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-1.5" style={{ background: confidenceColor }} />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-1.5" style={{ background: confidenceColor }} />
        </div>

        {/* Confidence label */}
        <div 
          className="absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-mono"
          style={{ 
            background: `${confidenceColor}15`,
            color: confidenceColor,
            border: `1px solid ${confidenceColor}30`,
          }}
        >
          {isDetected ? 'DETECTED' : 'SEARCHING'} {Math.round(detection.confidence * 100)}%
        </div>

        {/* Edge tracking markers */}
        {[
          { cls: 'top-1/2 -left-1 -translate-y-1/2' },
          { cls: 'top-1/2 -right-1 -translate-y-1/2' },
          { cls: '-top-1 left-1/2 -translate-x-1/2' },
          { cls: '-bottom-1 left-1/2 -translate-x-1/2' },
        ].map((marker, i) => (
          <div 
            key={i}
            className={`absolute w-1.5 h-1.5 rounded-full ${marker.cls}`}
            style={{ background: confidenceColor }}
          />
        ))}
      </div>
    </div>
  );
});

ObjectDetectionOverlay.displayName = 'ObjectDetectionOverlay';
