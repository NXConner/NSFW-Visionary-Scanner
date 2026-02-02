import React from "react";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";

import type { VisualStep } from "@/components/mensHealthGuide/types";

export function VisualStepsDisplay({ steps }: { steps: VisualStep[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {steps.map(step => (
        <div
          key={step.step}
          className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {step.step}
            </span>
            <span className="font-medium text-sm">{step.title}</span>
            {step.duration && (
              <Badge variant="outline" className="text-xs ml-auto">
                <Clock className="w-3 h-3 mr-1" />
                {step.duration}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{step.description}</p>
          {step.caution && (
            <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {step.caution}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
