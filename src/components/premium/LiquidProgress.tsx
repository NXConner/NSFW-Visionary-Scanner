import * as React from "react";
import { cn } from "@/lib/utils";

export interface LiquidProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  min?: number;
  max?: number;
  /** Height of the bar in px (defaults to 12). */
  height?: number;
  /** Show bubble particles inside the liquid. */
  bubbles?: boolean;
  /** If true, renders threshold markers (33% and 66%). */
  markers?: boolean;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function percent(value: number, min: number, max: number) {
  if (max === min) return 0;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

/**
 * Liquid-style progress bar with animated wave + optional bubbles.
 * Pure CSS animation; respects prefers-reduced-motion via CSS.
 */
export function LiquidProgress({
  value,
  min = 0,
  max = 100,
  height = 12,
  bubbles = true,
  markers = true,
  className,
  style,
  ...props
}: LiquidProgressProps) {
  const pct = percent(value, min, max);

  // Color ramps: green -> yellow -> red.
  const fill = pct < 33 ? "liquid-fill-good" : pct < 66 ? "liquid-fill-warn" : "liquid-fill-bad";

  return (
    <div
      className={cn("liquid-progress", className)}
      style={{ ...style, ["--lp-h" as any]: `${height}px` }}
      {...props}
    >
      <div className="liquid-track">
        <div className={cn("liquid-fill", fill)} style={{ width: `${pct}%` }}>
          <div className="liquid-wave liquid-wave-1" />
          <div className="liquid-wave liquid-wave-2" />
          {bubbles && (
            <>
              <span className="liquid-bubble liquid-bubble-1" />
              <span className="liquid-bubble liquid-bubble-2" />
              <span className="liquid-bubble liquid-bubble-3" />
            </>
          )}
        </div>

        {markers && (
          <>
            <div className="liquid-marker liquid-marker-33" />
            <div className="liquid-marker liquid-marker-66" />
          </>
        )}
      </div>
    </div>
  );
}
