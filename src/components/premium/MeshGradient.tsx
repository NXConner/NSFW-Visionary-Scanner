import * as React from "react";

import { cn } from "@/lib/utils";

export type MeshGradientVariant = "hero" | "scanner" | "dashboard";

export interface MeshGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: MeshGradientVariant;
  /** Controls blob opacity. */
  intensity?: "subtle" | "default" | "strong";
}

const variantVars: Record<MeshGradientVariant, React.CSSProperties> = {
  hero: {
    ["--mesh-c1" as any]: "hsl(var(--primary) / 0.55)",
    ["--mesh-c2" as any]: "hsl(var(--accent) / 0.45)",
    ["--mesh-c3" as any]: "hsl(var(--cyan-glow) / 0.35)",
    ["--mesh-c4" as any]: "hsl(var(--purple-accent) / 0.35)",
  },
  scanner: {
    ["--mesh-c1" as any]: "hsl(var(--primary) / 0.45)",
    ["--mesh-c2" as any]: "hsl(var(--accent) / 0.35)",
    ["--mesh-c3" as any]: "hsl(var(--warning) / 0.22)",
    ["--mesh-c4" as any]: "hsl(var(--success) / 0.2)",
  },
  dashboard: {
    ["--mesh-c1" as any]: "hsl(var(--primary) / 0.35)",
    ["--mesh-c2" as any]: "hsl(var(--accent) / 0.3)",
    ["--mesh-c3" as any]: "hsl(var(--success) / 0.22)",
    ["--mesh-c4" as any]: "hsl(var(--warning) / 0.18)",
  },
};

const intensityClass: Record<NonNullable<MeshGradientProps["intensity"]>, string> = {
  subtle: "opacity-70",
  default: "opacity-100",
  strong: "opacity-[1.15]",
};

/**
 * Animated mesh gradient background (CSS-only blobs).
 * Designed to be placed inside a relatively-positioned container.
 */
export function MeshGradient({
  className,
  variant = "hero",
  intensity = "default",
  style,
  ...props
}: MeshGradientProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "mesh-gradient pointer-events-none absolute inset-0 overflow-hidden",
        intensityClass[intensity],
        className,
      )}
      style={{ ...variantVars[variant], ...style }}
      {...props}
    >
      <div className="mesh-blob mesh-blob-1" />
      <div className="mesh-blob mesh-blob-2" />
      <div className="mesh-blob mesh-blob-3" />
      <div className="mesh-blob mesh-blob-4" />
      <div className="mesh-vignette" />
    </div>
  );
}
