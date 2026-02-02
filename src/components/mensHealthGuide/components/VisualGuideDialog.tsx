import React, { useMemo } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StepByStepVisualGuide } from "@/components/StepByStepVisualGuide";

import type { VisualContent } from "@/lib/visualContentManager";
import type { GuideSection } from "@/components/mensHealthGuide/types";

export function VisualGuideDialog({
  openTitle,
  onClose,
  guides,
  exerciseVisuals,
}: {
  openTitle: string | null;
  onClose: () => void;
  guides: GuideSection[];
  exerciseVisuals: VisualContent[];
}) {
  const guide = useMemo(() => guides.find(g => g.title === openTitle) ?? null, [guides, openTitle]);

  if (!openTitle) return null;

  return (
    <Dialog open={!!openTitle} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{openTitle} - Interactive Guide</DialogTitle>
        </DialogHeader>
        {guide?.visualSteps ? (
          <StepByStepVisualGuide
            title={guide.title}
            description={guide.whatIsIt}
            steps={guide.visualSteps.map((step, idx) => ({
              number: step.step,
              title: step.title,
              description: step.description,
              instructions: guide.howToUse.slice(idx, idx + 1),
              duration: step.duration,
              caution: step.caution,
              visualContent: exerciseVisuals
                .filter(v => v.tags.some(tag => step.title.toLowerCase().includes(tag)))
                .slice(0, 1),
            }))}
            onComplete={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
