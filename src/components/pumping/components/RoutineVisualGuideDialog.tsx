import React, { useMemo } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StepByStepVisualGuide } from "@/components/StepByStepVisualGuide";

import type { VisualContent } from "@/lib/visualContentManager";
import type { PumpingRoutine } from "@/components/pumping/types";

export function RoutineVisualGuideDialog({
  routineName,
  routines,
  pumpingVisuals,
  onClose,
}: {
  routineName: string | null;
  routines: PumpingRoutine[];
  pumpingVisuals: VisualContent[];
  onClose: () => void;
}) {
  const routine = useMemo(
    () => routines.find(r => r.name === routineName) ?? null,
    [routineName, routines],
  );

  if (!routineName) return null;

  const routineVisuals = pumpingVisuals.filter(v =>
    v.tags.some(tag => routineName.toLowerCase().includes(tag) || tag.includes("pump")),
  );

  return (
    <Dialog open={!!routineName} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{routineName} - Visual Guide</DialogTitle>
        </DialogHeader>
        {routine ? (
          <StepByStepVisualGuide
            title={routine.name}
            description={routine.description}
            steps={routine.steps.map((step, idx) => ({
              number: idx + 1,
              title: `Step ${idx + 1}`,
              description: step,
              instructions: [step],
              visualContent: routineVisuals.slice(idx, idx + 1),
            }))}
            onComplete={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
