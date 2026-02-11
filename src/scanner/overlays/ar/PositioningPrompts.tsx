/**
 * PositioningPrompts
 * User guidance prompts for positioning during capture
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Check,
  AlertCircle,
  Hand,
} from "lucide-react";
import type { PositionFeedback, PositionStatus } from "@/lib/ar/measurementCalculations";

export interface PositioningPromptsProps {
  /** Position feedback data */
  feedback: PositionFeedback;
  /** Whether position is stable */
  isStable?: boolean;
  /** Whether capture is ready */
  captureReady?: boolean;
  /** Show direction indicators */
  showDirectionIndicators?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function PositioningPrompts({
  feedback,
  isStable = false,
  captureReady = false,
  showDirectionIndicators = true,
  className,
}: PositioningPromptsProps) {
  // Get icon and color based on status
  const getStatusConfig = (status: PositionStatus) => {
    switch (status) {
      case "good":
        return {
          icon: Check,
          color: "#22c55e",
          bgColor: "rgba(34, 197, 94, 0.2)",
          borderColor: "rgba(34, 197, 94, 0.5)",
        };
      case "adjust":
        return {
          icon: Hand,
          color: "#eab308",
          bgColor: "rgba(234, 179, 8, 0.2)",
          borderColor: "rgba(234, 179, 8, 0.5)",
        };
      case "poor":
        return {
          icon: AlertCircle,
          color: "#ef4444",
          bgColor: "rgba(239, 68, 68, 0.2)",
          borderColor: "rgba(239, 68, 68, 0.5)",
        };
    }
  };

  const config = getStatusConfig(feedback.status);
  const StatusIcon = config.icon;

  // Determine which direction arrows to show
  const { adjustments } = feedback;
  const showArrows = showDirectionIndicators && feedback.status !== "good";

  // Get prompts based on capture state
  const getPromptText = (): string => {
    if (captureReady) {
      return "Perfect! Tap to capture";
    }
    if (isStable && feedback.status === "good") {
      return "Hold steady...";
    }
    return feedback.message;
  };

  return (
    <motion.div
      className={cn("flex flex-col items-center gap-3", className)}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Direction indicators */}
      {showArrows && (
        <div className="relative w-24 h-24">
          {/* Up arrow */}
          <AnimatePresence>
            {adjustments.moveUp && (
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <motion.div
                  animate={{ y: [-2, -6, -2] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowUp className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Down arrow */}
          <AnimatePresence>
            {adjustments.moveDown && (
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <motion.div
                  animate={{ y: [2, 6, 2] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowDown className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left arrow */}
          <AnimatePresence>
            {adjustments.moveLeft && (
              <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <motion.div
                  animate={{ x: [-2, -6, -2] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowLeft className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right arrow */}
          <AnimatePresence>
            {adjustments.moveRight && (
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <motion.div
                  animate={{ x: [2, 6, 2] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ArrowRight className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Zoom in (move closer) */}
          <AnimatePresence>
            {adjustments.moveCloser && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ZoomIn className="w-8 h-8 text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Zoom out (move farther) */}
          <AnimatePresence>
            {adjustments.moveFarther && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
              >
                <motion.div
                  animate={{ scale: [1, 0.8, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ZoomOut className="w-8 h-8 text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tilt indicators */}
          <AnimatePresence>
            {adjustments.tiltLeft && (
              <motion.div
                className="absolute top-1/2 left-2 -translate-y-1/2"
                initial={{ opacity: 0, rotate: 45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{ rotate: [-5, 5, -5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <RotateCcw className="w-5 h-5 text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {adjustments.tiltRight && (
              <motion.div
                className="absolute top-1/2 right-2 -translate-y-1/2"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{ rotate: [5, -5, 5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <RotateCw className="w-5 h-5 text-yellow-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Main prompt card */}
      <motion.div
        className="px-5 py-3 rounded-full flex items-center gap-3 shadow-lg"
        style={{
          backgroundColor: config.bgColor,
          borderWidth: 1,
          borderColor: config.borderColor,
        }}
        animate={{
          scale: captureReady ? [1, 1.02, 1] : 1,
          boxShadow: captureReady
            ? [`0 0 0 0 ${config.color}50`, `0 0 0 8px ${config.color}00`]
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
        transition={{
          duration: 1.5,
          repeat: captureReady ? Infinity : 0,
        }}
      >
        <motion.div
          animate={{
            scale: feedback.status === "adjust" ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.5, repeat: feedback.status === "adjust" ? Infinity : 0 }}
        >
          <StatusIcon className="w-5 h-5" style={{ color: config.color }} />
        </motion.div>

        <span className="text-sm font-medium" style={{ color: config.color }}>
          {getPromptText()}
        </span>
      </motion.div>

      {/* Stability indicator dots */}
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isStable
                ? "#22c55e"
                : i < 3
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(255,255,255,0.1)",
            }}
            animate={{
              scale: isStable && captureReady ? [1, 1.5, 1] : 1,
            }}
            transition={{
              delay: i * 0.1,
              duration: 0.3,
              repeat: isStable && captureReady ? Infinity : 0,
              repeatDelay: 0.5,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default PositioningPrompts;
