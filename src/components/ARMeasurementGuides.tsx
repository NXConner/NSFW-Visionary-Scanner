import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Move, RotateCw, Target, Maximize2 } from "lucide-react";
import { VisualContentDisplay } from "./VisualContentDisplay";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";

interface ARMeasurementGuidesProps {
  isActive: boolean;
  measurementType: "length" | "circumference" | "angle";
  detectedDimensions?: { width: number; height: number };
  calibrationFactor?: number;
}

export const ARMeasurementGuides = ({
  isActive,
  measurementType,
  detectedDimensions,
  calibrationFactor = 1,
}: ARMeasurementGuidesProps) => {
  const [guidePosition, setGuidePosition] = useState({ x: 50, y: 50 });
  const [guideLength, setGuideLength] = useState(120);
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [showVisualGuide, setShowVisualGuide] = useState(false);

  // Load visual content for measurement guides
  const { content: measurementVisuals } = useVisualContent({
    categories: [VISUAL_CONTENT_CATEGORIES.MEASUREMENT, VISUAL_CONTENT_CATEGORIES.TUTORIALS],
    autoLoad: true,
    autoInvert: true,
  });

  useEffect(() => {
    if (detectedDimensions) {
      setGuideLength(detectedDimensions.height * calibrationFactor);
      setShowMeasurement(true);
    }
  }, [detectedDimensions, calibrationFactor]);

  if (!isActive) return null;

  const renderLengthGuide = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 pointer-events-none"
    >
      {/* Vertical measurement line */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="measureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main measurement line */}
        <motion.line
          x1="50%"
          y1="15%"
          x2="50%"
          y2="85%"
          stroke="url(#measureGradient)"
          strokeWidth="3"
          strokeDasharray="8 4"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* Top marker */}
        <motion.g
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <line x1="45%" y1="15%" x2="55%" y2="15%" stroke="hsl(var(--primary))" strokeWidth="2" />
          <circle cx="50%" cy="15%" r="6" fill="hsl(var(--primary))" className="animate-pulse" />
        </motion.g>

        {/* Bottom marker */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <line x1="45%" y1="85%" x2="55%" y2="85%" stroke="hsl(var(--primary))" strokeWidth="2" />
          <circle cx="50%" cy="85%" r="6" fill="hsl(var(--primary))" className="animate-pulse" />
        </motion.g>

        {/* Ruler ticks */}
        {[20, 30, 40, 50, 60, 70, 80].map(y => (
          <motion.line
            key={y}
            x1="48%"
            y1={`${y}%`}
            x2="52%"
            y2={`${y}%`}
            stroke="hsl(var(--primary) / 0.5)"
            strokeWidth="1"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3 + y * 0.01 }}
          />
        ))}
      </svg>

      {/* Measurement display */}
      <AnimatePresence>
        {showMeasurement && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 glass-card rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-2 text-primary">
              <Ruler className="w-4 h-4" />
              <span className="text-lg font-bold">{(guideLength / 10).toFixed(1)} cm</span>
            </div>
            <p className="text-xs text-muted-foreground">Estimated length</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderCircumferenceGuide = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
    >
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="circGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>

        {/* Outer ring */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="url(#circGradient)"
          strokeWidth="2"
          strokeDasharray="8 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Inner measurement ring */}
        <motion.circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        />

        {/* Measurement points */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
          const x = 100 + 80 * Math.cos((angle * Math.PI) / 180);
          const y = 100 + 80 * Math.sin((angle * Math.PI) / 180);
          return (
            <motion.circle
              key={angle}
              cx={x}
              cy={y}
              r="4"
              fill="hsl(var(--primary))"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + angle * 0.001 }}
              className="animate-pulse"
            />
          );
        })}
      </svg>

      {/* Circumference label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 glass-card rounded-xl px-4 py-2"
      >
        <div className="flex items-center gap-2 text-primary">
          <RotateCw className="w-4 h-4" />
          <span className="font-semibold">Wrap measurement</span>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderAngleGuide = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 pointer-events-none"
    >
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="angleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--success))" />
            <stop offset="50%" stopColor="hsl(var(--warning))" />
            <stop offset="100%" stopColor="hsl(var(--destructive))" />
          </linearGradient>
        </defs>

        {/* Reference line (0°) */}
        <motion.line
          x1="50%"
          y1="50%"
          x2="50%"
          y2="20%"
          stroke="hsl(var(--muted-foreground) / 0.5)"
          strokeWidth="2"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />

        {/* Angle arc */}
        <motion.path
          d="M 50% 50% Q 60% 35% 65% 50%"
          fill="none"
          stroke="url(#angleGradient)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Angle markers */}
        {[0, 15, 30, 45].map(angle => {
          const x = 50 + 20 * Math.sin((angle * Math.PI) / 180);
          const y = 50 - 20 * Math.cos((angle * Math.PI) / 180);
          return (
            <motion.text
              key={angle}
              x={`${x}%`}
              y={`${y}%`}
              fill="hsl(var(--muted-foreground))"
              fontSize="10"
              textAnchor="middle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + angle * 0.02 }}
            >
              {angle}°
            </motion.text>
          );
        })}
      </svg>

      {/* Angle indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 glass-card rounded-xl px-4 py-2"
      >
        <div className="flex items-center gap-2 text-primary">
          <Target className="w-4 h-4" />
          <span className="font-semibold">Curvature Detection</span>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {measurementType === "length" && renderLengthGuide()}
      {measurementType === "circumference" && renderCircumferenceGuide()}
      {measurementType === "angle" && renderAngleGuide()}

      {/* Instruction overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-20 left-4 right-4 glass-card rounded-xl p-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            {measurementType === "length" && <Maximize2 className="w-5 h-5 text-primary" />}
            {measurementType === "circumference" && <RotateCw className="w-5 h-5 text-primary" />}
            {measurementType === "angle" && <Target className="w-5 h-5 text-primary" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {measurementType === "length" && "Align subject with vertical guide"}
              {measurementType === "circumference" && "Position for wrap measurement"}
              {measurementType === "angle" && "Hold steady for curvature detection"}
            </p>
            <p className="text-xs text-muted-foreground">
              {measurementType === "length" && "Ensure full length is visible"}
              {measurementType === "circumference" && "Camera will estimate girth"}
              {measurementType === "angle" && "AI analyzing deviation angle"}
            </p>
          </div>
          {measurementVisuals.length > 0 && (
            <button
              onClick={() => setShowVisualGuide(!showVisualGuide)}
              className="px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
            >
              {showVisualGuide ? "Hide" : "Show"} Guide
            </button>
          )}
        </div>
      </motion.div>

      {/* Visual Guide Overlay */}
      {showVisualGuide && measurementVisuals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 right-4 glass-card rounded-xl p-4 max-h-64 overflow-y-auto"
        >
          <h4 className="text-sm font-semibold mb-2">Visual Reference Guide</h4>
          <VisualContentDisplay
            content={measurementVisuals
              .filter(v =>
                v.tags.some(
                  tag =>
                    tag.includes(measurementType) ||
                    tag.includes("measurement") ||
                    tag.includes("positioning"),
                ),
              )
              .slice(0, 2)}
            showThumbnails={false}
            className="max-h-48"
          />
        </motion.div>
      )}
    </div>
  );
};
