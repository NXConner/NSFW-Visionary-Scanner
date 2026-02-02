import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CalibrationData } from "@/components/calibrationWizard/types";
import { ShieldCheck, Target, Ruler } from "lucide-react";

export function StepVerifyIntro({ current }: { current: CalibrationData }) {
  const last = current.calibrationDate ? new Date(current.calibrationDate) : null;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Verify Calibration</h3>
        <p className="text-sm text-muted-foreground">
          Quickly confirm your calibration is still accurate (and update it if it drifted).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Reference</div>
          </div>
          <div className="text-xs text-muted-foreground">Using your existing reference</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{current.referenceType}</Badge>
            <Badge variant="outline">
              {Math.round(current.referenceWidth)}×{Math.round(current.referenceHeight)}mm
            </Badge>
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">Scale</div>
          </div>
          <div className="text-xs text-muted-foreground">Current pixels-per-mm</div>
          <div className="mt-2 font-mono text-sm">
            {Number.isFinite(current.pixelsPerMm) ? current.pixelsPerMm.toFixed(3) : "—"} px/mm
          </div>
        </Card>

        <Card className="p-4 border-border/50 bg-secondary/30">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-success" />
            <div className="text-sm font-semibold">Last updated</div>
          </div>
          <div className="text-xs text-muted-foreground">Calibration age</div>
          <div className="mt-2 text-sm">
            {last ? last.toLocaleString() : <span className="text-muted-foreground">Unknown</span>}
          </div>
        </Card>
      </div>

      <Card className="p-4 border-border/50 bg-background/60">
        <div className="text-sm font-semibold mb-1">What you’ll do</div>
        <ol className="text-sm text-muted-foreground list-decimal ml-5 space-y-1">
          <li>Place the same reference object flat.</li>
          <li>Capture a photo straight above it.</li>
          <li>Tap the 4 corners (TL, TR, BR, BL).</li>
        </ol>
      </Card>
    </div>
  );
}
