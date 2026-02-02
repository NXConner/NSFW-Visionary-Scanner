import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle } from "lucide-react";

import type { CalibrationData, ReferenceType } from "@/components/calibrationWizard/types";
import { referenceObjects } from "@/components/calibrationWizard/lib/referenceObjects";

function qualityLabel(confidence?: number): {
  label: string;
  variant: "default" | "secondary" | "outline";
  warn: boolean;
} {
  const c = typeof confidence === "number" ? confidence : 0;
  if (c >= 0.85) return { label: "Excellent", variant: "default", warn: false };
  if (c >= 0.7) return { label: "Good", variant: "secondary", warn: false };
  if (c >= 0.55) return { label: "Fair", variant: "outline", warn: true };
  return { label: "Poor", variant: "outline", warn: true };
}

export function Step4Complete({
  isCalibrating,
  calibrationResult,
  referenceType,
}: {
  isCalibrating: boolean;
  calibrationResult: CalibrationData | null;
  referenceType: ReferenceType;
}) {
  const q = qualityLabel(calibrationResult?.calibrationConfidence);
  return (
    <div className="space-y-6 animate-fade-in text-center">
      {isCalibrating ? (
        <div className="py-12">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
          <h3 className="text-lg font-semibold">Calculating...</h3>
          <p className="text-sm text-muted-foreground">Processing calibration data</p>
        </div>
      ) : calibrationResult ? (
        <>
          <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h3 className="text-xl font-semibold text-success">Calibration Complete!</h3>
          <p className="text-muted-foreground">
            Your scanner is now calibrated for accurate measurements
          </p>

          <div className="flex items-center justify-center gap-2">
            <Badge variant={q.variant}>{q.label} calibration</Badge>
            {q.warn ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                Consider recalibrating with flatter framing
              </span>
            ) : null}
          </div>

          <Card className="bg-secondary/30 border-border/50 text-left">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference Object</span>
                <span className="font-medium">{referenceObjects[referenceType].name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference Size</span>
                <span className="font-medium">
                  {calibrationResult.referenceWidth} × {calibrationResult.referenceHeight} mm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scale Factor</span>
                <span className="font-medium font-mono">
                  {calibrationResult.pixelsPerMm.toFixed(4)} px/mm
                </span>
              </div>
              {calibrationResult.calibrationDiagnostics ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scale (W/H)</span>
                    <span className="font-medium font-mono">
                      {calibrationResult.calibrationDiagnostics.pixelsPerMmWidth.toFixed(4)} /{" "}
                      {calibrationResult.calibrationDiagnostics.pixelsPerMmHeight.toFixed(4)} px/mm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skew</span>
                    <span className="font-medium">
                      {calibrationResult.calibrationDiagnostics.skewPercent}%
                    </span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calibrated</span>
                <span className="font-medium">
                  {calibrationResult.calibrationDate?.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
