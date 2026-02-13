import { Badge } from "@/components/ui/badge";

export type CurvatureCaptureView = "dorsal" | "lateral";

export function CurvatureScanOverlay({
  view,
  step,
  totalSteps,
  instruction,
  showReferenceZone = true,
  showCenterline = true,
}: {
  view: CurvatureCaptureView;
  step: number;
  totalSteps: number;
  instruction?: string;
  showReferenceZone?: boolean;
  showCenterline?: boolean;
}) {
  const viewLabel = view === "dorsal" ? "Dorsal (top-down)" : "Lateral (side)";
  const defaultInstruction =
    view === "dorsal"
      ? "Align the base to the baseline. Keep the shaft centered."
      : "Side view: align the base to the baseline. Keep the full curve visible.";

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="curvGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(56,189,248,0.82)" />
            <stop offset="1" stopColor="rgba(167,139,250,0.70)" />
          </linearGradient>
          <filter id="curvShadow">
            <feDropShadow dx="0" dy="0.25" stdDeviation="0.35" floodColor="rgba(0,0,0,0.55)" />
          </filter>
        </defs>

        {/* soft vignette */}
        <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,0.10)" />

        {/* safe frame */}
        <rect
          x="8"
          y="8"
          width="84"
          height="84"
          rx="2"
          fill="transparent"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth="0.4"
        />
        <rect
          x="12"
          y="12"
          width="76"
          height="76"
          rx="2"
          fill="transparent"
          stroke="url(#curvGlow)"
          strokeWidth="0.6"
          strokeDasharray="2.2 1.8"
          filter="url(#curvShadow)"
        />

        {/* centerline */}
        {showCenterline && (
          <>
            <line
              x1="50"
              y1="14"
              x2="50"
              y2="86"
              stroke="rgba(255,255,255,0.20)"
              strokeWidth="0.35"
              strokeDasharray="3 2"
            />
            <circle cx="50" cy="22" r="1.4" fill="rgba(255,255,255,0.75)" />
            <circle cx="50" cy="78" r="1.4" fill="rgba(255,255,255,0.75)" />
          </>
        )}

        {/* base baseline */}
        <line
          x1="18"
          y1="82"
          x2="82"
          y2="82"
          stroke="url(#curvGlow)"
          strokeWidth="0.7"
          strokeDasharray="2.8 1.6"
          filter="url(#curvShadow)"
        />
        <rect x="18" y="82.8" width="64" height="5.6" fill="rgba(0,0,0,0.20)" />

        {/* reference zone for calibration object */}
        {showReferenceZone && (
          <>
            <rect
              x="8"
              y="86"
              width="28"
              height="10"
              fill="rgba(0,0,0,0.25)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.35"
            />
            <text x="9.5" y="92.3" fontSize="3.1" fill="rgba(255,255,255,0.78)">
              Reference
            </text>
            <text x="9.5" y="95.6" fontSize="2.6" fill="rgba(255,255,255,0.55)">
              (optional)
            </text>
          </>
        )}

        {/* dorsal vs lateral hinting */}
        {view === "dorsal" ? (
          <>
            <text x="50" y="17" textAnchor="middle" fontSize="3.4" fill="rgba(255,255,255,0.70)">
              TOP VIEW
            </text>
          </>
        ) : (
          <>
            <text x="50" y="17" textAnchor="middle" fontSize="3.4" fill="rgba(255,255,255,0.70)">
              SIDE VIEW
            </text>
          </>
        )}
      </svg>

      {/* header chips */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <Badge
          className="bg-background/70 border border-border/50 text-foreground"
          variant="outline"
        >
          Curvature Scan
        </Badge>
        <Badge
          className="bg-background/70 border border-border/50 text-foreground"
          variant="outline"
        >
          {step}/{totalSteps}
        </Badge>
        <Badge className="bg-primary/15 border-primary/25 text-primary" variant="outline">
          {viewLabel}
        </Badge>
      </div>

      {/* guidance text */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[min(560px,92%)]">
        <div className="rounded-xl border border-border/50 bg-background/60 backdrop-blur px-4 py-3 shadow-sm">
          <div className="text-sm font-medium">Guidance</div>
          <div className="text-xs text-muted-foreground mt-1">
            {instruction || defaultInstruction}
          </div>
        </div>
      </div>
    </div>
  );
}
