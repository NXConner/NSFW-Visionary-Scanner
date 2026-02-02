import * as React from "react";

import type { OverlayPresetId } from "../types";

export function OverlaySvgGuides({
  preset,
  className,
}: {
  preset: OverlayPresetId;
  className?: string;
}) {
  // SVG viewBox is normalized to 100x100; consumer should stretch to container.
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="scannerGuideGlow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(56,189,248,0.85)" />
          <stop offset="1" stopColor="rgba(167,139,250,0.75)" />
        </linearGradient>
      </defs>

      {/* Dark vignette */}
      <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.10)" />

      {preset === "classic-frame" && (
        <>
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            fill="transparent"
            stroke="url(#scannerGuideGlow)"
            strokeWidth="0.8"
            strokeDasharray="2.2 1.6"
          />
          {/* Safe margins */}
          <rect
            x="18"
            y="18"
            width="64"
            height="64"
            fill="transparent"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="0.35"
          />
        </>
      )}

      {preset === "centerline" && (
        <>
          <line
            x1="50"
            y1="8"
            x2="50"
            y2="92"
            stroke="url(#scannerGuideGlow)"
            strokeWidth="0.8"
            strokeDasharray="3 2"
          />
          <circle cx="50" cy="15" r="2.2" fill="rgba(255,255,255,0.85)" />
          <circle cx="50" cy="85" r="2.2" fill="rgba(255,255,255,0.85)" />
        </>
      )}

      {preset === "ruler-guide" && (
        <>
          <rect
            x="8"
            y="78"
            width="40"
            height="14"
            fill="rgba(0,0,0,0.25)"
            stroke="url(#scannerGuideGlow)"
            strokeWidth="0.6"
          />
          <text x="10" y="87" fontSize="4" fill="rgba(255,255,255,0.8)">
            Place reference here
          </text>
          <line x1="8" y1="70" x2="92" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="0.35" />
        </>
      )}

      {preset === "multi-angle" && (
        <>
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            fill="transparent"
            stroke="url(#scannerGuideGlow)"
            strokeWidth="0.8"
          />
          <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.22)" strokeWidth="0.35" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.22)" strokeWidth="0.35" />
          <text x="12" y="16" fontSize="4" fill="rgba(255,255,255,0.8)">
            Front / Left / Right
          </text>
        </>
      )}
    </svg>
  );
}

