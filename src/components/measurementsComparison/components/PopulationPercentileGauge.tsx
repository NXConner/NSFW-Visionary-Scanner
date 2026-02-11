import { formatLength, round1 } from "@/lib/measurementsComparison";
import type { UnitSystem } from "@/lib/measurementsComparison";

type Props = {
  label: string;
  unitSystem: UnitSystem;
  /** User latest (cm) */
  valueCm: number;
  /** Population reference points (cm) */
  p5Cm: number;
  p50Cm: number;
  p95Cm: number;
  /** Optional comparisons */
  communityMeanCm?: number | null;
  personalMeanCm?: number | null;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function pctPos(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function approxPercentile(valueCm: number, p5: number, p50: number, p95: number): number | null {
  if (![valueCm, p5, p50, p95].every(Number.isFinite)) return null;
  // Piecewise linear interpolation between 5th↔50th↔95th.
  if (valueCm <= p5) return 5;
  if (valueCm >= p95) return 95;
  if (valueCm <= p50) return 5 + ((valueCm - p5) / Math.max(0.0001, p50 - p5)) * 45;
  return 50 + ((valueCm - p50) / Math.max(0.0001, p95 - p50)) * 45;
}

export function PopulationPercentileGauge({
  label,
  unitSystem,
  valueCm,
  p5Cm,
  p50Cm,
  p95Cm,
  communityMeanCm,
  personalMeanCm,
}: Props) {
  const min = Math.max(0.001, Math.min(p5Cm, valueCm, p50Cm, p95Cm));
  const max = Math.max(p95Cm, valueCm, p50Cm);

  const p5 = clamp(pctPos(p5Cm, min, max), 0, 100);
  const p50 = clamp(pctPos(p50Cm, min, max), 0, 100);
  const p95 = clamp(pctPos(p95Cm, min, max), 0, 100);
  const you = clamp(pctPos(valueCm, min, max), 0, 100);
  const comm = communityMeanCm != null ? clamp(pctPos(communityMeanCm, min, max), 0, 100) : null;
  const pers = personalMeanCm != null ? clamp(pctPos(personalMeanCm, min, max), 0, 100) : null;

  const pct = approxPercentile(valueCm, p5Cm, p50Cm, p95Cm);

  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground font-mono">
          ~P{pct != null ? round1(pct) : "—"} • {formatLength(valueCm, unitSystem)}
        </div>
      </div>

      <div className="mt-3">
        <div className="relative h-3 rounded-full bg-muted/40 overflow-hidden">
          {/* 5th–95th range */}
          <div
            className="absolute top-0 bottom-0 rounded-full bg-primary/25"
            style={{ left: `${p5}%`, width: `${Math.max(0, p95 - p5)}%` }}
            aria-hidden
          />
          {/* median */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-primary/70"
            style={{ left: `${p50}%` }}
            aria-hidden
          />

          {/* optional: personal mean marker */}
          {pers != null && (
            <div
              className="absolute -top-1 h-5 w-[2px] bg-secondary-foreground/60"
              style={{ left: `${pers}%` }}
              title="Your average"
              aria-hidden
            />
          )}

          {/* optional: community mean marker */}
          {comm != null && (
            <div
              className="absolute -top-1 h-5 w-[2px] bg-accent-foreground/60"
              style={{ left: `${comm}%` }}
              title="Community mean"
              aria-hidden
            />
          )}

          {/* you */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary shadow-sm border border-primary-foreground/20"
            style={{ left: `calc(${you}% - 6px)` }}
            aria-label={`You: ${formatLength(valueCm, unitSystem)}`}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span title="5th percentile">P5: {formatLength(p5Cm, unitSystem)}</span>
          <span title="50th percentile (median)">P50: {formatLength(p50Cm, unitSystem)}</span>
          <span title="95th percentile">P95: {formatLength(p95Cm, unitSystem)}</span>
        </div>
      </div>
    </div>
  );
}
