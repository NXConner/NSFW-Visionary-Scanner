import * as React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";
import { useTiltContext } from "./TiltContext";

export interface TiltLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Depth in px. Higher = more parallax. */
  depth?: number;
  /** Optional z translation for extra 3D feel. */
  z?: number;
}

/**
 * Optional parallax layer for use inside `TiltCard`.
 * If rendered outside of a TiltCard, it behaves like a normal div.
 */
export function TiltLayer({ depth = 10, z = 0, className, children, ...props }: TiltLayerProps) {
  const ctx = useTiltContext();
  const fallback = useMotionValue(0);
  const sx = ctx?.sx ?? fallback;
  const sy = ctx?.sy ?? fallback;

  const x = useTransform(sx, v => v * depth);
  const y = useTransform(sy, v => v * depth);

  if (!ctx?.enabled) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      style={{
        x,
        y,
        transform: z ? `translateZ(${z}px)` : undefined,
        transformStyle: "preserve-3d",
      }}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
