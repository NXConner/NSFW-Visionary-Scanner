import React from "react";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export function WizardFooter({
  step,
  canProceed,
  onBack,
  onNext,
  onDone,
}: {
  step: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onDone: () => void;
}) {
  return (
    <CardFooter className="border-t border-border/50 flex justify-between">
      <Button variant="outline" onClick={onBack}>
        <ChevronLeft className="w-4 h-4 mr-2" />
        {step === 1 ? "Cancel" : "Back"}
      </Button>

      {step < 4 ? (
        <Button onClick={onNext} disabled={!canProceed}>
          {step === 3 ? "Calibrate" : "Next"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      ) : (
        <Button onClick={onDone}>
          <Sparkles className="w-4 h-4 mr-2" />
          Done
        </Button>
      )}
    </CardFooter>
  );
}
