import * as React from "react";
import { motion, type MotionProps, useInView, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export type RevealVariant = "fade" | "fade-up" | "scale" | "slide-left" | "slide-right" | "wipe";

export interface RevealProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  once?: boolean;
  margin?: string;
}

const variantsByName: Record<RevealVariant, NonNullable<MotionProps["variants"]>> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "fade-up": {
    hidden: { opacity: 0, y: 18, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: 18 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: -18 },
    visible: { opacity: 1, x: 0 },
  },
  wipe: {
    hidden: { opacity: 0, clipPath: "inset(0 0 100% 0 round 12px)" },
    visible: { opacity: 1, clipPath: "inset(0 0 0% 0 round 12px)" },
  },
};

export function Reveal({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  once = true,
  margin = "-10% 0px -10% 0px",
  ...props
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once, margin: margin as any });

  if (reduceMotion) {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={cn("will-change-transform", className)}
      variants={variantsByName[variant]}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
