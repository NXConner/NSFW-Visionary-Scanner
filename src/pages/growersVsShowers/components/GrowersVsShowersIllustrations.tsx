import type React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, ArrowRight, Layers } from "lucide-react";

function DiagramCard(props: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  badge?: string;
}) {
  const { title, subtitle, children, badge } = props;
  return (
    <Card className="glass border-border/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        {badge ? (
          <Badge variant="outline" className="text-[10px] whitespace-nowrap">
            {badge}
          </Badge>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

function SimpleBars(props: {
  leftLabel: string;
  rightLabel: string;
  leftHeightPct: number;
  rightHeightPct: number;
}) {
  const { leftLabel, rightLabel, leftHeightPct, rightHeightPct } = props;
  return (
    <div className="grid grid-cols-2 gap-4 items-end h-28">
      <div className="flex flex-col items-center justify-end gap-2 h-full">
        <div
          className="w-12 rounded-md bg-secondary/60 border border-border/60"
          style={{ height: `${Math.max(4, Math.min(100, leftHeightPct))}%` }}
          aria-label={leftLabel}
        />
        <div className="text-[11px] text-muted-foreground">{leftLabel}</div>
      </div>
      <div className="flex flex-col items-center justify-end gap-2 h-full">
        <div
          className="w-12 rounded-md bg-primary/60 border border-primary/30"
          style={{ height: `${Math.max(4, Math.min(100, rightHeightPct))}%` }}
          aria-label={rightLabel}
        />
        <div className="text-[11px] text-muted-foreground">{rightLabel}</div>
      </div>
    </div>
  );
}

function OverlapMiniChart() {
  // Safe, abstract “overlap” diagram: two semi-transparent distributions with a shared middle.
  return (
    <svg
      viewBox="0 0 320 80"
      className="w-full h-20"
      role="img"
      aria-label="Abstract overlap diagram"
    >
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.2" />
          <stop offset="60%" stopColor="hsl(var(--secondary))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path
        d="M10,70 C40,10 90,10 140,70 C170,90 200,90 230,70 C260,45 290,45 310,70 L310,80 L10,80 Z"
        fill="url(#g1)"
      />
      <path
        d="M10,70 C30,45 60,45 90,70 C120,95 150,95 180,70 C210,10 250,10 310,70 L310,80 L10,80 Z"
        fill="url(#g2)"
      />
      <line x1="10" y1="70" x2="310" y2="70" stroke="hsl(var(--border))" strokeWidth="2" />
      <text x="10" y="18" fontSize="10" fill="hsl(var(--muted-foreground))">
        Wide overlap: flaccid size ≠ erect size
      </text>
    </svg>
  );
}

export function GrowersVsShowersIllustrations() {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="text-base font-semibold">Illustrations (safe diagrams)</div>
        <div className="text-xs text-muted-foreground">
          These are abstract visuals to explain the concept—no explicit imagery.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <DiagramCard
          title="Concept: change, not “final size”"
          subtitle="Two people can end up similar when erect with different flaccid baselines."
          badge="diagram"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Layers className="w-4 h-4 text-primary" />
            Flaccid baseline varies more than erect baseline.
          </div>
          <SimpleBars
            leftLabel="Flaccid (variable)"
            rightLabel="Erect (more stable)"
            leftHeightPct={35}
            rightHeightPct={78}
          />
        </DiagramCard>

        <DiagramCard
          title="Cold shrinkage (common)"
          subtitle="Cold/stress can reduce flaccid size temporarily without changing your true erect potential."
          badge="temperature"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Thermometer className="w-4 h-4 text-primary" />
            Cold → sympathetic tone ↑ → retraction/vasoconstriction.
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="rounded-lg border border-border/50 bg-background/30 p-3 w-full">
              <div className="text-[11px] text-muted-foreground mb-2">Warm</div>
              <div
                className="h-3 rounded bg-secondary/60 border border-border/60"
                style={{ width: "70%" }}
              />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div className="rounded-lg border border-border/50 bg-background/30 p-3 w-full">
              <div className="text-[11px] text-muted-foreground mb-2">Cold</div>
              <div
                className="h-3 rounded bg-secondary/60 border border-border/60"
                style={{ width: "40%" }}
              />
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">
            This helps explain how a “grower” can look very small when cold, yet still measure
            average-or-above when erect.
          </div>
        </DiagramCard>

        <DiagramCard
          title="Stats reality: lots of overlap"
          subtitle="Population averages are distributions; categories aren’t clean boxes."
          badge="stats"
        >
          <OverlapMiniChart />
          <div className="text-[11px] text-muted-foreground">
            Measurement protocols differ across studies; treat stats as context, not a verdict.
          </div>
        </DiagramCard>
      </div>
    </section>
  );
}
