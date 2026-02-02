/**
 * Live Region Component
 * Announces dynamic content changes to screen readers
 */

import { ReactNode } from "react";

interface LiveRegionProps {
  children: ReactNode;
  mode?: "polite" | "assertive" | "off";
  atomic?: boolean;
  relevant?: "additions" | "removals" | "text" | "all";
  className?: string;
}

export const LiveRegion = ({
  children,
  mode = "polite",
  atomic = true,
  relevant = "additions",
  className,
}: LiveRegionProps) => {
  return (
    <div aria-live={mode} aria-atomic={atomic} aria-relevant={relevant} className={className}>
      {children}
    </div>
  );
};

export default LiveRegion;
