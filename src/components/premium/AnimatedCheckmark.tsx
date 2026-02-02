import * as React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";

export interface AnimatedCheckmarkProps extends React.SVGAttributes<SVGSVGElement> {
  /** Size of the checkmark in pixels */
  size?: number;
  /** Stroke color (defaults to currentColor) */
  color?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Show success circle background */
  withCircle?: boolean;
  /** Circle background color */
  circleColor?: string;
}

export function AnimatedCheckmark({
  size = 24,
  color = "currentColor",
  strokeWidth = 2.5,
  delay = 0,
  withCircle = false,
  circleColor = "hsl(var(--success))",
  className,
  style,
  ...props
}: AnimatedCheckmarkProps) {
  const reduceMotion = useReducedMotion();

  const checkmarkStyle: React.CSSProperties = {
    ...style,
    animationDelay: reduceMotion ? "0s" : `${delay}s`,
  };

  if (withCircle) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          !reduceMotion && "success-pop",
        )}
        style={{
          width: size * 1.6,
          height: size * 1.6,
          backgroundColor: circleColor,
          animationDelay: `${delay}s`,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(!reduceMotion && "checkmark-animated checkmark-animated-delay", className)}
          style={checkmarkStyle}
          {...props}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(!reduceMotion && "checkmark-animated", className)}
      style={checkmarkStyle}
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
