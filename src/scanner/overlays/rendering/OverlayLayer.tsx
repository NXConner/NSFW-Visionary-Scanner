import * as React from "react";

export function OverlayLayer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["pointer-events-none absolute inset-0", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
