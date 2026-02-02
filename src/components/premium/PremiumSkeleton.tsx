import * as React from "react";
import { cn } from "@/lib/utils";

export interface PremiumSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant style */
  variant?: "default" | "card" | "avatar" | "text" | "button";
  /** Width (CSS value or number for px) */
  width?: string | number;
  /** Height (CSS value or number for px) */
  height?: string | number;
  /** Border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Pulse glow effect */
  glow?: boolean;
}

const roundedMap = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const variantDefaults: Record<
  NonNullable<PremiumSkeletonProps["variant"]>,
  Partial<PremiumSkeletonProps>
> = {
  default: { height: 20, rounded: "md" },
  card: { height: 200, rounded: "xl" },
  avatar: { width: 48, height: 48, rounded: "full" },
  text: { height: 16, rounded: "sm" },
  button: { width: 100, height: 40, rounded: "lg" },
};

export function PremiumSkeleton({
  variant = "default",
  width,
  height,
  rounded,
  glow = false,
  className,
  style,
  ...props
}: PremiumSkeletonProps) {
  const defaults = variantDefaults[variant];
  const finalWidth = width ?? defaults.width;
  const finalHeight = height ?? defaults.height;
  const finalRounded = rounded ?? defaults.rounded ?? "md";

  return (
    <div
      className={cn("skeleton-premium", roundedMap[finalRounded], glow && "pulse-glow", className)}
      style={{
        width: typeof finalWidth === "number" ? `${finalWidth}px` : finalWidth,
        height: typeof finalHeight === "number" ? `${finalHeight}px` : finalHeight,
        ...style,
      }}
      {...props}
    />
  );
}

export interface SkeletonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of skeleton items to render */
  count?: number;
  /** Gap between items */
  gap?: number;
  /** Direction */
  direction?: "row" | "column";
  /** Children to render instead of count */
  children?: React.ReactNode;
}

export function SkeletonGroup({
  count = 3,
  gap = 12,
  direction = "column",
  children,
  className,
  style,
  ...props
}: SkeletonGroupProps) {
  return (
    <div
      className={cn("flex", direction === "column" ? "flex-col" : "flex-row", className)}
      style={{
        gap: `${gap}px`,
        ...style,
      }}
      {...props}
    >
      {children ??
        Array.from({ length: count }).map((_, i) => (
          <PremiumSkeleton key={i} className={`stagger-${Math.min(i + 1, 6)}`} />
        ))}
    </div>
  );
}

/** Card skeleton preset */
export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 rounded-xl bg-card border border-border/50", className)} {...props}>
      <SkeletonGroup gap={16}>
        <div className="flex items-center gap-3">
          <PremiumSkeleton variant="avatar" glow />
          <div className="flex-1 space-y-2">
            <PremiumSkeleton variant="text" width="60%" />
            <PremiumSkeleton variant="text" width="40%" height={12} />
          </div>
        </div>
        <PremiumSkeleton height={100} rounded="lg" />
        <div className="flex gap-2">
          <PremiumSkeleton variant="button" width="30%" />
          <PremiumSkeleton variant="button" width="30%" />
        </div>
      </SkeletonGroup>
    </div>
  );
}
