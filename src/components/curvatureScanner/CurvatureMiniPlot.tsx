import * as React from "react";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Simple synthetic curve visualization based on:
 * - length (normalized)
 * - curvature angle (degrees)
 *
 * This does NOT reconstruct a true 3D curve; it provides an intuitive “PDScan-like”
 * visualization for the measured angle.
 */
export function CurvatureMiniPlot({
  angleDeg,
  label,
  className,
}: {
  angleDeg: number;
  label: string;
  className?: string;
}) {
  const a = clamp(Number(angleDeg || 0), 0, 90);
  const rad = (a * Math.PI) / 180;

  // Build a quadratic Bezier from base (left) to tip (right)
  // Control point y offset increases with angle
  const w = 240;
  const h = 120;
  const pad = 12;
  const x0 = pad;
  const y0 = h - pad;
  const x1 = w - pad;
  const y1 = pad + 10;
  const bend = Math.sin(rad) * 58; // strength
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2 - bend;

  const path = `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xs font-mono text-muted-foreground">{a.toFixed(0)}°</div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[120px] rounded-xl border border-border/50 bg-black/20"
      >
        <defs>
          <linearGradient id="curvPlotGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(56,189,248,0.92)" />
            <stop offset="1" stopColor="rgba(167,139,250,0.82)" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="url(#curvPlotGlow)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx={x0} cy={y0} r="6" fill="rgba(255,255,255,0.92)" />
        <circle cx={x1} cy={y1} r="6" fill="rgba(255,255,255,0.92)" />
        {/* baseline */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(255,255,255,0.14)" />
      </svg>
    </div>
  );
}
