/**
 * Visually Hidden Component
 * Hides content visually but keeps it accessible to screen readers
 */

import { ReactNode } from "react";

interface VisuallyHiddenProps {
  children: ReactNode;
}

export const VisuallyHidden = ({ children }: VisuallyHiddenProps) => {
  return <span className="sr-only">{children}</span>;
};

export default VisuallyHidden;
