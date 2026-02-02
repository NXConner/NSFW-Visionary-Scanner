import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { formatLength, readOptionalNumberEnv, round1 } from "@/lib/measurementsComparison";
import type { UnitSystem } from "@/lib/measurementsComparison";
import { summarizeGrowersVsShowers } from "@/lib/growersVsShowers";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { Users, TrendingUp, Info } from "lucide-react";
import { GrowersVsShowersKnowledge } from "./components/GrowersVsShowersKnowledge";

function ClassificationBadge({ value }: { value: string }) {
  if (value === "grower")
    return <Badge className="bg-success/20 text-success border border-success/30">Grower</Badge>;
  if (value === "shower")
    return <Badge className="bg-primary/20 text-primary border border-primary/30">Shower</Badge>;
  if (value === "hybrid") return <Badge variant="secondary">Hybrid</Badge>;
  return <Badge variant="outline">Insufficient data</Badge>;
}

export function GrowersVsShowersCard({ unitSystem = "dual" }: { unitSystem?: UnitSystem }) {
  const flagEnabled = useFeatureFlag("growers_vs_showers", false);
  const { scans, isLoading } = useData();
  const { measurementUnits } = useSettings();
  const { isSuperAdmin } = useAuth();
  const { isSuperAdmin: isSuperAdminRole } = useUserRoles();
  const resolvedUnitSystem: UnitSystem = measurementUnits ?? unitSystem;

  const opts = useMemo(() => {
    const showerMax = readOptionalNumberEnv("VITE_GVS_SHOWER_MAX_DELTA_CM");
    const growerMin = readOptionalNumberEnv("VITE_GVS_GROWER_MIN_DELTA_CM");
    const minPerState = readOptionalNumberEnv("VITE_GVS_MIN_PER_STATE");
    return {
      showerMaxDeltaCm: showerMax ?? undefined,
      growerMinDeltaCm: growerMin ?? undefined,
      minPerState: minPerState ? Math.max(1, Math.round(minPerState)) : undefined,
    };
  }, []);

  const summary = useMemo(() => summarizeGrowersVsShowers(scans || [], opts), [scans, opts]);

  const enabled = Boolean(flagEnabled || isSuperAdmin || isSuperAdminRole);
  if (!enabled) return null;

  const lengthDelta = summary.deltas.lengthCm;
  const girthDelta = summary.deltas.girthCm;
  const flLen = summary.averages.flaccidLengthCm;
  const erLen = summary.averages.erectLengthCm;
  const flG = summary.averages.flaccidGirthCm;
  const erG = summary.averages.erectGirthCm;

  const maxLen = Math.max(flLen ?? 0, erLen ?? 0, 0.0001);
  const maxG = Math.max(flG ?? 0, erG ?? 0, 0.0001);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Growers vs Showers
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Classifies your growth profile using your labeled measurements (flaccid vs erect /
            paired).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ClassificationBadge value={summary.classification} />
          <Badge variant="outline" className="whitespace-nowrap">
            {resolvedUnitSystem === "dual"
              ? "cm + in"
              : resolvedUnitSystem === "imperial"
                ? "in"
                : "cm"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading && (
          <div className="rounded-lg border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground">
            Loading your history…
          </div>
        )}

        <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Profile summary
            </div>
            <div className="text-xs text-muted-foreground">
              Samples: flaccid {summary.sample.flaccidCount} • erect {summary.sample.erectCount} •
              paired {summary.sample.pairedCount}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">{summary.rationale}</div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Length</div>
                <div className="text-xs font-mono text-muted-foreground">
                  Δ{" "}
                  {lengthDelta != null && flLen != null
                    ? `${round1(lengthDelta)} cm (${round1(lengthDelta / 2.54 || 0)} in)`
                    : "—"}{" "}
                  {summary.deltas.lengthPercent != null
                    ? `(${round1(summary.deltas.lengthPercent)}%)`
                    : ""}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">Flaccid avg</div>
                  <div className="text-sm font-mono">
                    {flLen != null ? formatLength(flLen, resolvedUnitSystem) : "—"}
                  </div>
                  <Progress value={flLen != null ? (flLen / maxLen) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">Erect avg</div>
                  <div className="text-sm font-mono">
                    {erLen != null ? formatLength(erLen, resolvedUnitSystem) : "—"}
                  </div>
                  <Progress value={erLen != null ? (erLen / maxLen) * 100 : 0} className="h-2" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Girth (circumference)</div>
                <div className="text-xs font-mono text-muted-foreground">
                  Δ{" "}
                  {girthDelta != null && flG != null
                    ? `${round1(girthDelta)} cm (${round1(girthDelta / 2.54 || 0)} in)`
                    : "—"}{" "}
                  {summary.deltas.girthPercent != null
                    ? `(${round1(summary.deltas.girthPercent)}%)`
                    : ""}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">Flaccid avg</div>
                  <div className="text-sm font-mono">
                    {flG != null ? formatLength(flG, resolvedUnitSystem) : "—"}
                  </div>
                  <Progress value={flG != null ? (flG / maxG) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">Erect avg</div>
                  <div className="text-sm font-mono">
                    {erG != null ? formatLength(erG, resolvedUnitSystem) : "—"}
                  </div>
                  <Progress value={erG != null ? (erG / maxG) * 100 : 0} className="h-2" />
                </div>
              </div>
            </div>
          </div>

          {summary.warnings.length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-muted-foreground">
              <div className="font-medium text-warning flex items-center gap-2">
                <Info className="w-4 h-4" />
                Data quality notes
              </div>
              <ul className="mt-1 space-y-1 list-disc pl-4">
                {summary.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {summary.insights.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-3">
            <div className="text-sm font-medium">Context insights (beta)</div>
            <div className="grid md:grid-cols-2 gap-3">
              {summary.insights.map(i => (
                <div
                  key={i.key}
                  className="rounded-lg border border-border/50 bg-background/30 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-sm">{i.title}</div>
                    <Badge variant="outline">n={i.sampleSize}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{i.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-3">
          <div className="text-sm font-medium">Guide & related topics</div>
          <GrowersVsShowersKnowledge />
        </div>
      </CardContent>
    </Card>
  );
}
