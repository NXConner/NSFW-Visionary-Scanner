import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export type PageTransitionVariant = "fade" | "fade-slide" | "fade-scale";

export interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Key that changes when content changes (e.g. route or tab id). */
  transitionKey: string;
  children: React.ReactNode;
  variant?: PageTransitionVariant;
}

const variants: Record<PageTransitionVariant, any> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "fade-slide": {
    initial: { opacity: 0, y: 10, filter: "blur(2px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -10, filter: "blur(2px)" },
  },
  "fade-scale": {
    initial: { opacity: 0, scale: 0.985, filter: "blur(2px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.985, filter: "blur(2px)" },
  },
};

/**
 * Cross-fades content when transitionKey changes.
 * Great for tab/route transitions.
 */
export function PageTransition({
  transitionKey,
  children,
  className,
  variant = "fade-scale",
  ...props
}: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} {...props}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={transitionKey}
          {...variants[variant]}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
