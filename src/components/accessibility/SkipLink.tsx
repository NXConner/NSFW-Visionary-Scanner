/**
 * Skip Link Component
 * Allows keyboard users to skip navigation and jump to main content
 */

import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export const SkipLink = ({
  href = "#main-content",
  children = "Skip to main content",
  className,
}: SkipLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]",
        "focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-all duration-200",
        className,
      )}
    >
      {children}
    </a>
  );
};

export default SkipLink;
