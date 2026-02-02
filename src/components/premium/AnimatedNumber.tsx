import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

export interface AnimatedNumberProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  value: number;
  from?: number;
  duration?: number;
  decimals?: number;
  /** If provided, formats the number before render. */
  format?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  from = 0,
  duration = 0.9,
  decimals = 0,
  format,
  ...props
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const mv = useMotionValue(from);

  React.useEffect(() => {
    if (reduceMotion) return;
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [mv, value, duration, reduceMotion]);

  const text = useTransform(mv, latest => {
    const v = Number.isFinite(latest) ? latest : value;
    if (format) return format(v);
    return v.toFixed(decimals);
  });

  if (reduceMotion) {
    const v = Number.isFinite(value) ? value : 0;
    const fallback = format ? format(v) : v.toFixed(decimals);
    return <span {...props}>{fallback}</span>;
  }

  return <motion.span {...(props as any)}>{text as any}</motion.span>;
}
