import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use premium shimmer with primary color accent */
  premium?: boolean;
  /** Add pulse glow effect */
  glow?: boolean;
}

function Skeleton({ className, premium = false, glow = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md",
        premium ? "skeleton-premium" : "skeleton-shimmer",
        glow && "pulse-glow",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
