import { formatLength } from "@/lib/measurementsComparison";
import type { UnitSystem } from "@/lib/measurementsComparison";

type Props = {
  metricLabel: string;
  unitSystem: UnitSystem;
  userValueCm: number;
  baselineLabel: string;
  baselineValueCm: number;
};

export function BaselineMiniViz({
  metricLabel,
  unitSystem,
  userValueCm,
  baselineLabel,
  baselineValueCm,
}: Props) {
  const max = Math.max(0.0001, userValueCm, baselineValueCm);
  const userPct = Math.min(100, Math.max(0, (userValueCm / max) * 100));
  const basePct = Math.min(100, Math.max(0, (baselineValueCm / max) * 100));

  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{metricLabel}</div>
        <div className="text-[11px] text-muted-foreground font-mono">
          You: {formatLength(userValueCm, unitSystem)} • {baselineLabel}:{" "}
          {formatLength(baselineValueCm, unitSystem)}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 items-end h-20">
        <div className="flex flex-col items-center justify-end gap-1 h-full">
          <div
            className="w-10 rounded-md bg-primary/60 border border-primary/30 shadow-sm"
            style={{ height: `${userPct}%` }}
            aria-label={`You: ${formatLength(userValueCm, unitSystem)}`}
          />
          <div className="text-[10px] text-muted-foreground">You</div>
        </div>
        <div className="flex flex-col items-center justify-end gap-1 h-full">
          <div
            className="w-10 rounded-md bg-secondary/60 border border-border/60 shadow-sm"
            style={{ height: `${basePct}%` }}
            aria-label={`${baselineLabel}: ${formatLength(baselineValueCm, unitSystem)}`}
          />
          <div className="text-[10px] text-muted-foreground">{baselineLabel}</div>
        </div>
      </div>
    </div>
  );
}
