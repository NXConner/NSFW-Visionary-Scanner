import React from "react";

import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, X } from "lucide-react";

export function WizardHeader({
  step,
  totalSteps,
  progress,
  onClose,
}: {
  step: number;
  totalSteps: number;
  progress: number;
  onClose: () => void;
}) {
  return (
    <CardHeader className="border-b border-border/50">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            Calibration Wizard
          </CardTitle>
          <CardDescription className="mt-1">
            Calibrate for accurate real-world measurements
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close calibration wizard">
          <X className="w-5 h-5" />
        </Button>
      </div>
      <Progress value={progress} className="mt-4 h-2" />
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>
          Step {step} of {totalSteps}
        </span>
        <span>{Math.round(progress)}% complete</span>
      </div>
    </CardHeader>
  );
}
