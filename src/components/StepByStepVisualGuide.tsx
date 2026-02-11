/**
 * Step-by-Step Visual Guide Component
 * Displays instructions with accompanying images/videos for each step
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Image as ImageIcon,
  Video,
  CheckCircle2,
} from "lucide-react";
import { VisualContentDisplay } from "./VisualContentDisplay";
import type { VisualContent } from "@/lib/visualContentManager";

interface Step {
  number: number;
  title: string;
  description: string;
  instructions: string[];
  visualContent?: VisualContent[];
  duration?: string;
  caution?: string;
  tips?: string[];
}

interface StepByStepVisualGuideProps {
  title: string;
  description?: string;
  steps: Step[];
  showProgress?: boolean;
  autoAdvance?: boolean;
  onComplete?: () => void;
}

export const StepByStepVisualGuide: React.FC<StepByStepVisualGuideProps> = ({
  title,
  description,
  steps,
  showProgress = true,
  autoAdvance = false,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (autoAdvance && currentStep < steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1000);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {/* Progress */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Current Step */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">{currentStepData.number}</span>
              </div>
              <div>
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                {currentStepData.duration && (
                  <Badge variant="outline" className="mt-1">
                    {currentStepData.duration}
                  </Badge>
                )}
              </div>
            </div>
            {completedSteps.has(currentStep) && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          <p className="text-muted-foreground">{currentStepData.description}</p>

          {/* Visual Content */}
          {currentStepData.visualContent && currentStepData.visualContent.length > 0 && (
            <VisualContentDisplay
              content={currentStepData.visualContent}
              showThumbnails={false}
              autoPlay={isPlaying}
            />
          )}

          {/* Instructions */}
          {currentStepData.instructions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Instructions:</h4>
              <ol className="space-y-2">
                {currentStepData.instructions.map((instruction, idx) => (
                  <li
                    key={`instruction-${idx}-${instruction.slice(0, 20)}`}
                    className="flex gap-3 text-sm"
                  >
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0 font-semibold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 pt-1">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Caution */}
          {currentStepData.caution && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <p className="text-sm text-orange-400 flex items-start gap-2">
                <span className="font-semibold">⚠️ Caution:</span>
                {currentStepData.caution}
              </p>
            </div>
          )}

          {/* Tips */}
          {currentStepData.tips && currentStepData.tips.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h4 className="font-semibold text-sm mb-2 text-blue-400">💡 Tips:</h4>
              <ul className="space-y-1">
                {currentStepData.tips.map(tip => (
                  <li key={tip} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="flex gap-2">
          {!completedSteps.has(currentStep) && (
            <Button variant="outline" onClick={handleStepComplete}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
          <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>
            {currentStep === steps.length - 1 ? "Complete" : "Next"}
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2">
        {steps.map((step, stepIndex) => (
          <button
            key={`step-${step.number}-${stepIndex}`}
            type="button"
            onClick={() => setCurrentStep(stepIndex)}
            aria-label={`Go to step ${stepIndex + 1}`}
            className={`w-2 h-2 rounded-full transition-all ${
              stepIndex === currentStep
                ? "w-8 bg-primary"
                : completedSteps.has(stepIndex)
                  ? "bg-green-500"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
