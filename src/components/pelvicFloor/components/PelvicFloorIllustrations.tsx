import { cn } from "@/lib/utils";

function SvgWrap({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("rounded-xl border border-border/60 bg-muted/10 p-3", className)}>
      <div className="mb-2">
        <figcaption className="text-sm font-semibold text-foreground">{title}</figcaption>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </figure>
  );
}

export function PelvicSlingDiagram({ className }: { className?: string }) {
  return (
    <SvgWrap
      title="Pelvic floor as a sling"
      subtitle="A simplified, non-explicit illustration: the pelvic floor supports and lifts."
      className={className}
    >
      <svg
        viewBox="0 0 520 260"
        className="w-full h-auto"
        role="img"
        aria-label="Pelvic floor sling diagram"
      >
        <defs>
          <linearGradient id="pfGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
            <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Pelvis outline (abstract) */}
        <path
          d="M105 62c38-22 82-33 155-33s117 11 155 33c18 10 32 26 36 45 9 46-18 95-63 118-30 16-75 24-128 24s-98-8-128-24c-45-23-72-72-63-118 4-19 18-35 36-45Z"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeOpacity="0.18"
          strokeWidth="6"
        />

        {/* Pelvic floor sling */}
        <path
          d="M150 155c45 32 78 45 110 45s65-13 110-45c-10 46-46 80-110 80s-100-34-110-80Z"
          fill="url(#pfGrad)"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.45"
          strokeWidth="4"
        />

        {/* Midline */}
        <line
          x1="260"
          y1="70"
          x2="260"
          y2="230"
          stroke="hsl(var(--foreground))"
          strokeOpacity="0.12"
          strokeWidth="3"
          strokeDasharray="8 10"
        />

        {/* Labels */}
        <g
          fill="hsl(var(--foreground))"
          fillOpacity="0.75"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="14"
        >
          <text x="38" y="98">
            Pelvic bones
          </text>
          <text x="38" y="120" fillOpacity="0.6">
            support structure
          </text>
          <text x="362" y="162">
            Pelvic floor
          </text>
          <text x="362" y="184" fillOpacity="0.6">
            “sling” muscles
          </text>
        </g>

        {/* Callout lines */}
        <path
          d="M120 112c30-8 55-16 76-24"
          stroke="hsl(var(--foreground))"
          strokeOpacity="0.25"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M360 172c-28 7-50 14-70 22"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.4"
          strokeWidth="3"
          fill="none"
        />
      </svg>
    </SvgWrap>
  );
}

export function LiftVsRelaxDiagram({ className }: { className?: string }) {
  return (
    <SvgWrap
      title="Lift vs relax (the key skill)"
      subtitle="Strength is useful, but the full release matters just as much."
      className={className}
    >
      <svg
        viewBox="0 0 520 260"
        className="w-full h-auto"
        role="img"
        aria-label="Lift versus relax diagram"
      >
        <defs>
          <linearGradient id="lift" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="relax" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
            <stop offset="1" stopColor="hsl(var(--foreground))" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Two panels */}
        <g>
          <rect
            x="18"
            y="18"
            width="236"
            height="224"
            rx="14"
            fill="hsl(var(--background))"
            opacity="0.45"
          />
          <rect
            x="266"
            y="18"
            width="236"
            height="224"
            rx="14"
            fill="hsl(var(--background))"
            opacity="0.45"
          />
          <rect
            x="18"
            y="18"
            width="236"
            height="224"
            rx="14"
            fill="none"
            stroke="hsl(var(--border))"
          />
          <rect
            x="266"
            y="18"
            width="236"
            height="224"
            rx="14"
            fill="none"
            stroke="hsl(var(--border))"
          />
        </g>

        {/* Left: Lift */}
        <g>
          <path
            d="M70 170c30-25 55-36 66-36s36 11 66 36c-10 34-36 56-66 56s-56-22-66-56Z"
            fill="url(#lift)"
            stroke="hsl(var(--primary))"
            strokeOpacity="0.55"
            strokeWidth="4"
          />
          <path
            d="M136 116v-30"
            stroke="hsl(var(--primary))"
            strokeOpacity="0.75"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M121 98l15-16 15 16"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeOpacity="0.75"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="36" y="48" fill="hsl(var(--foreground))" fillOpacity="0.85" fontSize="16">
            Lift (Kegel)
          </text>
          <text x="36" y="70" fill="hsl(var(--foreground))" fillOpacity="0.55" fontSize="13">
            gentle inward/upward
          </text>
        </g>

        {/* Right: Relax */}
        <g>
          <path
            d="M318 180c30-20 55-28 66-28s36 8 66 28c-6 22-16 34-28 40-12 6-23 8-38 8s-26-2-38-8c-12-6-22-18-28-40Z"
            fill="url(#relax)"
            stroke="hsl(var(--foreground))"
            strokeOpacity="0.22"
            strokeWidth="4"
          />
          <path
            d="M384 88v32"
            stroke="hsl(var(--foreground))"
            strokeOpacity="0.35"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M369 110l15 16 15-16"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeOpacity="0.35"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="284" y="48" fill="hsl(var(--foreground))" fillOpacity="0.85" fontSize="16">
            Relax (Reverse)
          </text>
          <text x="284" y="70" fill="hsl(var(--foreground))" fillOpacity="0.55" fontSize="13">
            soften / drop
          </text>
        </g>
      </svg>
    </SvgWrap>
  );
}

export function BreathTimingMiniChart({ className }: { className?: string }) {
  return (
    <SvgWrap
      title="Breath timing (simple)"
      subtitle="Exhale on the lift, inhale on the release."
      className={className}
    >
      <svg
        viewBox="0 0 520 200"
        className="w-full h-auto"
        role="img"
        aria-label="Breath timing chart"
      >
        <defs>
          <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
            <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <rect
          x="18"
          y="18"
          width="484"
          height="164"
          rx="14"
          fill="hsl(var(--background))"
          opacity="0.45"
        />
        <rect
          x="18"
          y="18"
          width="484"
          height="164"
          rx="14"
          fill="none"
          stroke="hsl(var(--border))"
        />

        {/* Baseline */}
        <line
          x1="42"
          y1="118"
          x2="478"
          y2="118"
          stroke="hsl(var(--foreground))"
          strokeOpacity="0.14"
          strokeWidth="3"
        />

        {/* Breath wave */}
        <path
          d="M42 118
             C 82 72, 122 72, 162 118
             C 202 164, 242 164, 282 118
             C 322 72, 362 72, 402 118
             C 442 164, 468 164, 478 118"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.6"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M42 118
             C 82 72, 122 72, 162 118
             C 202 164, 242 164, 282 118
             C 322 72, 362 72, 402 118
             C 442 164, 468 164, 478 118"
          fill="url(#wave)"
          stroke="none"
        />

        {/* Labels */}
        <g
          fill="hsl(var(--foreground))"
          fillOpacity="0.75"
          fontFamily="ui-sans-serif, system-ui"
          fontSize="14"
        >
          <text x="68" y="58">
            Exhale + lift
          </text>
          <text x="186" y="176">
            Inhale + relax
          </text>
          <text x="310" y="58">
            Exhale + lift
          </text>
          <text x="410" y="176">
            Inhale + relax
          </text>
        </g>
      </svg>
    </SvgWrap>
  );
}
