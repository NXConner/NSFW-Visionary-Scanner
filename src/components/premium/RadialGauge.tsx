import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface RadialGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  showValue?: boolean;
  valueSuffix?: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function RadialGauge({
  value,
  min = 0,
  max = 100,
  size = 124,
  strokeWidth = 10,
  label,
  subLabel,
  showValue = true,
  valueSuffix,
  className,
  ...props
}: RadialGaugeProps) {
  const reduceMotion = useReducedMotion();
  const id = React.useId();

  const bounded = clamp(value, min, max);
  const pct = max === min ? 0 : (bounded - min) / (max - min);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} {...props}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" />
            <stop offset="55%" stopColor="hsl(var(--warning))" />
            <stop offset="100%" stopColor="hsl(var(--destructive))" />
          </linearGradient>
          <filter id={`${id}-softGlow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.25" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.35 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--border) / 0.6)"
          strokeWidth={strokeWidth}
        />

        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id}-grad)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduceMotion ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.7 }}
          style={{
            transformOrigin: "50% 50%",
            transform: "rotate(-90deg)",
            filter: `url(#${id}-softGlow)`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>}
        {showValue && (
          <div className="text-2xl font-bold tracking-tight">
            {Math.round(bounded)}
            {valueSuffix ?? ""}
          </div>
        )}
        {subLabel && (
          <div className="text-[11px] text-muted-foreground leading-tight">{subLabel}</div>
        )}
      </div>
    </div>
  );
}
