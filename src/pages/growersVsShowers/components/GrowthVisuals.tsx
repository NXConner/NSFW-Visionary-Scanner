import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatLength, round1, clamp } from "@/lib/measurementsComparison";
import type { UnitSystem } from "@/lib/measurementsComparison";

function RatioBar({ label, ratio }: { label: string; ratio: number | null }) {
  // Ratio bar: 1.0 = baseline, 0..2.5 visual range (clamped)
  const min = 0;
  const max = 2.5;
  const normalized = ratio == null ? 0 : ((clamp(ratio, min, max) - min) / (max - min)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xs font-mono text-muted-foreground">
          {ratio == null ? "—" : `${round1(ratio)}×`}
        </div>
      </div>
      <Progress
        value={ratio == null ? 0 : normalized}
        className={`h-2 ${ratio == null ? "opacity-50" : ""}`}
      />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>0×</span>
        <span>1×</span>
        <span>2.5×</span>
      </div>
    </div>
  );
}

function SideBySideBars(props: {
  unitSystem: UnitSystem;
  metricLabel: string;
  flaccidCm: number | null;
  erectCm: number | null;
}) {
  const { unitSystem, metricLabel, flaccidCm, erectCm } = props;
  const max = Math.max(0.0001, flaccidCm ?? 0, erectCm ?? 0);
  const flPct = flaccidCm == null ? 0 : Math.min(100, Math.max(0, (flaccidCm / max) * 100));
  const erPct = erectCm == null ? 0 : Math.min(100, Math.max(0, (erectCm / max) * 100));
  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{metricLabel}</div>
        <div className="text-[11px] text-muted-foreground font-mono">
          Flaccid: {flaccidCm != null ? formatLength(flaccidCm, unitSystem) : "—"} • Erect:{" "}
          {erectCm != null ? formatLength(erectCm, unitSystem) : "—"}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 items-end h-24">
        <div className="flex flex-col items-center justify-end gap-1 h-full">
          <div
            className="w-10 rounded-md bg-secondary/60 border border-border/60 shadow-sm"
            style={{ height: `${flPct}%` }}
            aria-label={`Flaccid: ${flaccidCm != null ? formatLength(flaccidCm, unitSystem) : "unknown"}`}
          />
          <div className="text-[10px] text-muted-foreground">Flaccid</div>
        </div>
        <div className="flex flex-col items-center justify-end gap-1 h-full">
          <div
            className="w-10 rounded-md bg-primary/60 border border-primary/30 shadow-sm"
            style={{ height: `${erPct}%` }}
            aria-label={`Erect: ${erectCm != null ? formatLength(erectCm, unitSystem) : "unknown"}`}
          />
          <div className="text-[10px] text-muted-foreground">Erect</div>
        </div>
      </div>
    </div>
  );
}

export function GrowthVisuals(props: {
  unitSystem: UnitSystem;
  flaccidLengthCm: number | null;
  erectLengthCm: number | null;
  flaccidGirthCm: number | null;
  erectGirthCm: number | null;
}) {
  const { unitSystem, flaccidLengthCm, erectLengthCm, flaccidGirthCm, erectGirthCm } = props;
  const lengthRatio =
    flaccidLengthCm != null && erectLengthCm != null && flaccidLengthCm > 0
      ? erectLengthCm / flaccidLengthCm
      : null;
  const girthRatio =
    flaccidGirthCm != null && erectGirthCm != null && flaccidGirthCm > 0
      ? erectGirthCm / flaccidGirthCm
      : null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-base font-semibold">Visual growth profile</div>
          <div className="text-xs text-muted-foreground">
            Bars scale within each metric to your own max for quick shape/ratio understanding.
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          ratios + bars
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <SideBySideBars
          unitSystem={unitSystem}
          metricLabel="Length"
          flaccidCm={flaccidLengthCm}
          erectCm={erectLengthCm}
        />
        <SideBySideBars
          unitSystem={unitSystem}
          metricLabel="Girth (circumference)"
          flaccidCm={flaccidGirthCm}
          erectCm={erectGirthCm}
        />
      </div>

      <Card className="glass border-border/50 p-4">
        <div className="grid lg:grid-cols-2 gap-4">
          <RatioBar label="Length ratio (erect ÷ flaccid)" ratio={lengthRatio} />
          <RatioBar label="Girth ratio (erect ÷ flaccid)" ratio={girthRatio} />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          Tip: ratios become more meaningful with <span className="font-medium">paired</span>{" "}
          entries logged close together.
        </div>
      </Card>
    </section>
  );
}
