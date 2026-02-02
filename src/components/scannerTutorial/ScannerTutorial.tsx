import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Pause,
  Play,
  SkipForward,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";
import { VisualContentDisplay } from "@/components/VisualContentDisplay";

import { AnimationDemo } from "./AnimationDemo";
import { tutorialSteps } from "./tutorialSteps";
import type { ScannerTutorialProps } from "./types";

export const ScannerTutorial = ({ isOpen, onClose, onComplete }: ScannerTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  const { content: tutorialVisuals } = useVisualContent({
    categories: [VISUAL_CONTENT_CATEGORIES.TUTORIALS, VISUAL_CONTENT_CATEGORIES.MEASUREMENT],
    autoLoad: true,
    autoInvert: true,
  });

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  useEffect(() => {
    if (isPlaying && isOpen) {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (isLastStep) {
      onComplete();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
      setAnimationPhase(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setAnimationPhase(0);
    }
  };

  const skipTutorial = () => {
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto border-primary/20 shadow-2xl">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                Scanner Tutorial
              </CardTitle>
              <CardDescription className="mt-1">
                Step {currentStep + 1} of {tutorialSteps.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-4 h-2" />
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          <AnimationDemo step={step} animationPhase={animationPhase} />

          {tutorialVisuals.length > 0 && (
            <div className="mt-4">
              <VisualContentDisplay
                content={tutorialVisuals
                  .filter(v =>
                    v.tags.some(
                      tag => step.title.toLowerCase().includes(tag) || step.id.includes(tag),
                    ),
                  )
                  .slice(0, 1)}
                title="Visual Reference"
                showThumbnails={false}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-success/5 border-success/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Do
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {step.doList.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-success">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  Don't
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {step.dontList.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-destructive">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-1">
            {tutorialSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? "w-6 bg-primary" : i < currentStep ? "bg-success" : "bg-muted"
                }`}
                aria-label={`Go to tutorial step ${i + 1}`}
              />
            ))}
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/50 flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button variant="ghost" onClick={skipTutorial}>
            <SkipForward className="w-4 h-4 mr-2" />
            Skip Tutorial
          </Button>

          <Button onClick={nextStep}>
            {isLastStep ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
