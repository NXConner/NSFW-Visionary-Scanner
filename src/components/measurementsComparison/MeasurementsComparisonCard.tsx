import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Ruler, CircleDot, Users, Globe } from "lucide-react";
import { useMemo } from "react";
import { useMeasurementComparison } from "./hooks/useMeasurementComparison";
import {
  clamp,
  deltaVsAverage,
  formatLength,
  getAverageManBaselineCm,
  round1,
} from "@/lib/measurementsComparison";
import type { UnitSystem } from "@/lib/measurementsComparison";
import { useSettings } from "@/contexts/SettingsContext";
import { AverageManBaselineBlock } from "./components/AverageManBaselineBlock";
import { ManualEntryForm } from "@/components/ManualEntryForm";
import { PopulationPercentileGauge } from "./components/PopulationPercentileGauge";
import { getAverageManPercentilesCm } from "@/lib/measurementsComparison";
import { TripleComparisonViz } from "./components/TripleComparisonViz";

type Props = {
  unitSystem?: UnitSystem;
  communityWindowDays?: number;
  communityMinSample?: number;
};

function DeltaBadge({ value, avg }: { value: number; avg: number | null }) {
  const { measurementUnits } = useSettings();
  const d = deltaVsAverage(value, avg);
  if (d.absolute == null || d.percent == null) return <Badge variant="outline">—</Badge>;
  const up = d.absolute >= 0;
  const cm = `${up ? "+" : ""}${round1(d.absolute)} cm`;
  const inches = `${up ? "+" : ""}${round1(d.absolute / 2.54)} in`;
  const abs =
    measurementUnits === "dual"
      ? `${cm} (${inches})`
      : measurementUnits === "imperial"
        ? inches
        : cm;
  const label = `${abs} (${up ? "+" : ""}${round1(d.percent)}%)`;
  return <Badge variant={up ? "secondary" : "outline"}>{label}</Badge>;
}

function RelativeBar({ value, avg }: { value: number; avg: number | null }) {
  // Centered bar: 50 = exactly average, 0..100 maps to -50%..+50% (clamped).
  // If avg is unavailable, show a neutral "unknown" bar at center.
  const pct = avg != null && avg !== 0 ? ((value - avg) / avg) * 100 : null;
  const normalized = pct == null ? 50 : 50 + clamp(pct, -50, 50);
  return (
    <div className="relative">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/60" aria-hidden />
      <Progress value={normalized} className={`h-2 ${pct == null ? "opacity-60" : ""}`} />
    </div>
  );
}

export function MeasurementsComparisonCard({
  unitSystem = "dual",
  communityWindowDays = 3650,
  communityMinSample = 25,
}: Props) {
  const { measurementUnits } = useSettings();
  const resolvedUnitSystem: UnitSystem = measurementUnits ?? unitSystem;
  const { isLocalLoading, isCommunityLoading, isSignedIn, latest, personal, community } =
    useMeasurementComparison({
      communityWindowDays,
      communityMinSample,
    });

  const avgMan = useMemo(() => getAverageManBaselineCm(), []);
  const percentiles = useMemo(() => getAverageManPercentilesCm(), []);

  const hasLocal = Boolean(latest && latest.lengthCm > 0 && latest.girthCm > 0);
  const hasCommunity = Boolean(
    community && community.isSufficient && (community.avgLengthCm || community.avgGirthCm),
  );

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Measurements vs Averages
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Your latest measurement compared with your on-device average, the app user base average,
            and a population baseline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ManualEntryForm />
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
        {(isLocalLoading || isCommunityLoading) && (
          <div className="space-y-3">
            <Skeleton className="h-5 w-56" premium />
            <Skeleton className="h-16 w-full" premium />
            <Skeleton className="h-16 w-full" premium />
          </div>
        )}

        {!isLocalLoading && !hasLocal && (
          <>
            <AverageManBaselineBlock unitSystem={resolvedUnitSystem} />
            <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
              <p className="text-sm font-medium">No measurements yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a scan or use <span className="font-medium">Manual Entry</span> above to input
                measurements and see your comparisons update.
              </p>
            </div>
          </>
        )}

        {!isLocalLoading && hasLocal && latest && (
          <>
            <AverageManBaselineBlock
              unitSystem={resolvedUnitSystem}
              latestLengthCm={latest.lengthCm}
              latestGirthCm={latest.girthCm}
            />

            {/* Triple Comparison Visual - You vs Community vs Average Man */}
            <div className="grid md:grid-cols-2 gap-4">
              <TripleComparisonViz
                metricLabel="Length Comparison"
                unitSystem={resolvedUnitSystem}
                userValueCm={latest.lengthCm}
                communityValueCm={community?.avgLengthCm ?? null}
                averageManValueCm={avgMan.length.valueCm}
                isPlaceholderCommunity={community?.isPlaceholder}
              />
              <TripleComparisonViz
                metricLabel="Girth Comparison"
                unitSystem={resolvedUnitSystem}
                userValueCm={latest.girthCm}
                communityValueCm={community?.avgGirthCm ?? null}
                averageManValueCm={avgMan.girth.valueCm}
                isPlaceholderCommunity={community?.isPlaceholder}
              />
            </div>

            {/* Length */}
            <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-primary" />
                  <p className="font-semibold">Length</p>
                </div>
                <div className="text-sm font-mono">
                  {formatLength(latest.lengthCm, resolvedUnitSystem)}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Vs your average</p>
                  <RelativeBar value={latest.lengthCm} avg={personal.avgLengthCm} />
                  <DeltaBadge value={latest.lengthCm} avg={personal.avgLengthCm} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Vs app user base</p>
                  <RelativeBar value={latest.lengthCm} avg={community?.avgLengthCm ?? null} />
                  <DeltaBadge value={latest.lengthCm} avg={community?.avgLengthCm ?? null} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Vs average man
                  </p>
                  <RelativeBar value={latest.lengthCm} avg={avgMan.length.valueCm} />
                  <DeltaBadge value={latest.lengthCm} avg={avgMan.length.valueCm} />
                </div>
              </div>

              <div className="pt-2">
                <PopulationPercentileGauge
                  label="Population range (erect length)"
                  unitSystem={resolvedUnitSystem}
                  valueCm={latest.lengthCm}
                  p5Cm={percentiles.erectLengthCm.p5}
                  p50Cm={percentiles.erectLengthCm.p50}
                  p95Cm={percentiles.erectLengthCm.p95}
                  communityMeanCm={community?.avgLengthCm ?? null}
                  personalMeanCm={personal.avgLengthCm}
                />
              </div>
            </div>

            {/* Girth */}
            <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-primary" />
                  <p className="font-semibold">Girth (circumference)</p>
                </div>
                <div className="text-sm font-mono">
                  {formatLength(latest.girthCm, resolvedUnitSystem)}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Vs your average</p>
                  <RelativeBar value={latest.girthCm} avg={personal.avgGirthCm} />
                  <DeltaBadge value={latest.girthCm} avg={personal.avgGirthCm} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Vs app user base</p>
                  <RelativeBar value={latest.girthCm} avg={community?.avgGirthCm ?? null} />
                  <DeltaBadge value={latest.girthCm} avg={community?.avgGirthCm ?? null} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Vs average man
                  </p>
                  <RelativeBar value={latest.girthCm} avg={avgMan.girth.valueCm} />
                  <DeltaBadge value={latest.girthCm} avg={avgMan.girth.valueCm} />
                </div>
              </div>

              <div className="pt-2">
                <PopulationPercentileGauge
                  label="Population range (erect girth)"
                  unitSystem={resolvedUnitSystem}
                  valueCm={latest.girthCm}
                  p5Cm={percentiles.erectGirthCm.p5}
                  p50Cm={percentiles.erectGirthCm.p50}
                  p95Cm={percentiles.erectGirthCm.p95}
                  communityMeanCm={community?.avgGirthCm ?? null}
                  personalMeanCm={personal.avgGirthCm}
                />
              </div>
            </div>

            {/* Footer/meta */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Local samples: {personal.sampleSize}</Badge>
                {isSignedIn ? (
                  <Badge variant="outline">
                    App samples: {community?.sampleSize ?? 0}
                    {community && !community.isSufficient ? ` (need ${communityMinSample}+)` : ""}
                  </Badge>
                ) : (
                  <Badge variant="outline">Sign in to fetch app averages</Badge>
                )}
              </div>
              {hasCommunity && community && (
                <span>
                  Community window: {community.windowDays}d • Updated{" "}
                  {new Date(community.computedAtIso).toLocaleDateString()}
                </span>
              )}
            </div>
          </>
        )}

        {!isCommunityLoading && isSignedIn && !hasCommunity && (
          <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
            <p className="text-sm font-medium">Community averages not available yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              The app only shows community averages after enough scans exist (k-anonymity
              threshold).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
