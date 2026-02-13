import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { BaselineMiniViz } from "./BaselineMiniViz";
import { AVERAGE_MAN_BASELINE, formatLength, getAverageManBaselineCm } from "@/lib/measurementsComparison";
import type { UnitSystem } from "@/lib/measurementsComparison";

type Props = {
  unitSystem: UnitSystem;
  latestLengthCm?: number | null;
  latestGirthCm?: number | null;
};

export function AverageManBaselineBlock({ unitSystem, latestLengthCm, latestGirthCm }: Props) {
  const baseline = getAverageManBaselineCm();

  const configured = baseline.length.source === "env" || baseline.girth.source === "env";
  const likelyUnitsWarning: string[] = [];
  if (baseline.length.valueCm > 0 && baseline.length.valueCm < 9) {
    likelyUnitsWarning.push(
      "Average-man length baseline looks unusually low. If you entered inches, convert to centimeters.",
    );
  }
  if (baseline.girth.valueCm > 0 && baseline.girth.valueCm < 7) {
    likelyUnitsWarning.push(
      "Average-man girth baseline looks unusually low. If you entered inches, convert to centimeters.",
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <p className="font-semibold">Average man baseline (population mean)</p>
        </div>
        <Badge
          variant={configured ? "outline" : "secondary"}
          className="whitespace-nowrap"
          title={
            configured
              ? `Overridden via ${[baseline.length.envKeyUsed, baseline.girth.envKeyUsed].filter(Boolean).join(" / ")}`
              : "Using built-in research baseline (can be overridden via env)"
          }
        >
          {configured ? "Overridden" : "Research default"}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        Default values are from a large published meta-analysis. You can override via{" "}
        <span className="font-mono">VITE_AVERAGE_MAN_LENGTH_CM</span> and{" "}
        <span className="font-mono">VITE_AVERAGE_MAN_GIRTH_CM</span> (centimeters).
      </p>

      {likelyUnitsWarning.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-muted-foreground">
          <div className="font-medium text-warning">Baseline warning</div>
          <ul className="mt-1 space-y-1 list-disc pl-4">
            {likelyUnitsWarning.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Length baseline</p>
            <div className="text-sm font-mono">
              {formatLength(baseline.length.valueCm, unitSystem)}
            </div>
          </div>
          {latestLengthCm != null && Number.isFinite(latestLengthCm) && latestLengthCm > 0 ? (
            <BaselineMiniViz
              metricLabel="Length"
              unitSystem={unitSystem}
              userValueCm={latestLengthCm}
              baselineLabel="Avg man"
              baselineValueCm={baseline.length.valueCm}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Add your first measurement to see a visual comparison vs the population baseline.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Girth baseline</p>
            <div className="text-sm font-mono">
              {formatLength(baseline.girth.valueCm, unitSystem)}
            </div>
          </div>
          {latestGirthCm != null && Number.isFinite(latestGirthCm) && latestGirthCm > 0 ? (
            <BaselineMiniViz
              metricLabel="Girth"
              unitSystem={unitSystem}
              userValueCm={latestGirthCm}
              baselineLabel="Avg man"
              baselineValueCm={baseline.girth.valueCm}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Add your first measurement to see a visual comparison vs the population baseline.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-background/30 p-3">
        <div className="text-xs font-medium text-muted-foreground">Other reference means</div>
        <div className="mt-2 grid sm:grid-cols-3 gap-2 text-xs">
          <div className="rounded-md border border-border/50 bg-muted/10 p-2">
            <div className="text-[11px] text-muted-foreground">Flaccid length</div>
            <div className="font-mono">{formatLength(AVERAGE_MAN_BASELINE.flaccidLengthCm, unitSystem)}</div>
          </div>
          <div className="rounded-md border border-border/50 bg-muted/10 p-2">
            <div className="text-[11px] text-muted-foreground">Flaccid girth</div>
            <div className="font-mono">{formatLength(AVERAGE_MAN_BASELINE.flaccidGirthCm, unitSystem)}</div>
          </div>
          <div className="rounded-md border border-border/50 bg-muted/10 p-2">
            <div className="text-[11px] text-muted-foreground">Stretched flaccid length</div>
            <div className="font-mono">
              {formatLength(AVERAGE_MAN_BASELINE.stretchedFlaccidLengthCm, unitSystem)}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Source: Veale et al., BJU Int (2015) meta-analysis (measurement methods vary across studies).
        </p>
      </div>
    </div>
  );
}
