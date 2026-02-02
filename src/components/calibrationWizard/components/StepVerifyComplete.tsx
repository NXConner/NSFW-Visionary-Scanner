import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CalibrationData } from "@/components/calibrationWizard/types";
import { ArrowRight, CheckCircle2, AlertTriangle, Gauge, Triangle } from "lucide-react";

type VerifyVerdict = "excellent" | "good" | "fair" | "poor";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function verdictFrom({
  driftPercentAbs,
  skewPercent,
}: {
  driftPercentAbs: number;
  skewPercent: number;
}): VerifyVerdict {
  // Conservative thresholds: keep user safe from false precision.
  if (driftPercentAbs <= 1.5 && skewPercent <= 6) return "excellent";
  if (driftPercentAbs <= 3 && skewPercent <= 10) return "good";
  if (driftPercentAbs <= 6 && skewPercent <= 16) return "fair";
  return "poor";
}

function verdictBadge(verdict: VerifyVerdict) {
  switch (verdict) {
    case "excellent":
      return <Badge className="bg-success text-success-foreground">Excellent</Badge>;
    case "good":
      return <Badge className="bg-primary text-primary-foreground">Good</Badge>;
    case "fair":
      return <Badge className="bg-warning text-warning-foreground">Fair</Badge>;
    default:
      return <Badge className="bg-destructive text-destructive-foreground">Poor</Badge>;
  }
}

export function StepVerifyComplete({
  current,
  verified,
}: {
  current: CalibrationData;
  verified: CalibrationData;
}) {
  const drift = useMemo(() => {
    const oldV = current.pixelsPerMm;
    const newV = verified.pixelsPerMm;
    const denom = Math.max(1e-9, Math.abs(oldV));
    const driftPct = ((newV - oldV) / denom) * 100;
    return {
      driftPct,
      driftAbs: Math.abs(driftPct),
    };
  }, [current.pixelsPerMm, verified.pixelsPerMm]);

  const skew = useMemo(() => {
    const v = verified.calibrationDiagnostics?.skewPercent;
    return typeof v === "number" ? v : 0;
  }, [verified.calibrationDiagnostics?.skewPercent]);

  const conf = clamp01(
    typeof verified.calibrationConfidence === "number" ? verified.calibrationConfidence : 0,
  );
  const verdict = verdictFrom({ driftPercentAbs: drift.driftAbs, skewPercent: skew });

  const statusIcon =
    verdict === "excellent" || verdict === "good" ? (
      <CheckCircle2 className="w-5 h-5 text-success" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-warning" />
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon}
          <div className="text-lg font-semibold">Verification Result</div>
        </div>
        {verdictBadge(verdict)}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 border-border/50 bg-secondary/30">
          <div className="text-xs text-muted-foreground mb-2">Current calibration</div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm">{current.pixelsPerMm.toFixed(3)} px/mm</div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="font-mono text-sm">{verified.pixelsPerMm.toFixed(3)} px/mm</div>
          </div>
          <div className="mt-2 text-sm">
            Drift:{" "}
            <span
              className={
                drift.driftAbs <= 3 ? "text-success font-semibold" : "text-warning font-semibold"
              }
            >
              {drift.driftPct >= 0 ? "+" : ""}
              {drift.driftPct.toFixed(1)}%
            </span>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-secondary/30">
          <div className="text-xs text-muted-foreground mb-2">Quality</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium">Confidence</div>
            </div>
            <div className="font-mono text-sm">{Math.round(conf * 100)}%</div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Triangle className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium">Skew</div>
            </div>
            <div className="font-mono text-sm">{skew}%</div>
          </div>
        </Card>
      </div>

      <Card className="p-4 border-border/50 bg-background/60">
        <div className="text-sm font-semibold mb-1">Recommendation</div>
        <div className="text-sm text-muted-foreground">
          {verdict === "excellent" || verdict === "good"
            ? "Your calibration looks stable. You can keep it, or apply the update if you want the latest numbers."
            : verdict === "fair"
              ? "Your calibration may be drifting. Applying the update is recommended, and doing a full recalibration is even better if you can."
              : "Calibration quality is poor (high drift/skew). Do a full recalibration for accurate measurements."}
        </div>
      </Card>
    </div>
  );
}
