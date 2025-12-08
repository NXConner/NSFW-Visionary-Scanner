import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { triggerHaptic } from "@/lib/haptics";
import {
  Camera,
  BookOpen,
  Shield,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  X,
  Scan,
  Calendar,
  MapPin,
} from "lucide-react";
import { VisualContentDisplay } from "./VisualContentDisplay";
import { useVisualContent } from "@/hooks/useVisualContent";
import { VISUAL_CONTENT_CATEGORIES } from "@/lib/visualContentManager";

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const ONBOARDING_KEY = 'morphoscan_onboarding_complete';

const steps = [
  {
    icon: Scan,
    title: "Welcome to GrowthTracker",
    description: "Your private health monitoring companion. All data stays on your device, encrypted and secure.",
    color: "primary",
  },
  {
    icon: Camera,
    title: "Scanner",
    description: "Use the camera to take measurements. Get accurate readings for length, circumference, and curvature angle.",
    color: "primary",
  },
  {
    icon: Calendar,
    title: "Health Diary",
    description: "Track your progress over time with detailed logs, charts, and calendar views. Export reports for doctor visits.",
    color: "accent",
  },
  {
    icon: BookOpen,
    title: "Educational Content",
    description: "Learn about men's health topics, treatment options, and when to seek medical attention.",
    color: "warning",
  },
  {
    icon: TrendingUp,
    title: "Pumping Tracker",
    description: "Log pumping sessions, track gains, and follow safe routines with detailed guidance.",
    color: "success",
  },
  {
    icon: MapPin,
    title: "Find Specialists",
    description: "Locate urologists and specialists near you for professional consultation.",
    color: "primary",
  },
  {
    icon: Shield,
    title: "Your Privacy Matters",
    description: "All data is encrypted and stored locally. No cloud uploads, no tracking. You're in control.",
    color: "success",
  },
  {
    icon: Shield,
    title: "Important Disclaimer",
    description: "This app is for education and tracking only—not a substitute for medical advice. We're a tool, for your tool. Don't be a fool—we're not a doctor.",
    color: "warning",
  },
];

export const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Load visual content for onboarding
  const { content: onboardingVisuals } = useVisualContent({
    categories: [VISUAL_CONTENT_CATEGORIES.TUTORIALS],
    autoLoad: true,
    autoInvert: true,
    limit: 10,
  });

  const handleNext = () => {
    triggerHaptic('light');
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    triggerHaptic('light');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    triggerHaptic('success');
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    triggerHaptic('light');
    handleComplete();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  const colorClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      <Card variant="glass" className="max-w-md w-full animate-scale-in">
        <CardContent className="p-8">
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl ${colorClasses[step.color]} flex items-center justify-center animate-pulse-glow`}>
              <Icon className="w-10 h-10" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3">{step.title}</h2>
            <p className="text-muted-foreground mb-4">{step.description}</p>
            {/* Visual content for onboarding step */}
            {onboardingVisuals.length > 0 && currentStep < onboardingVisuals.length && (
              <div className="mt-4">
                <VisualContentDisplay
                  content={[onboardingVisuals[currentStep]]}
                  showThumbnails={false}
                  className="max-h-64"
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button variant="gradient" onClick={handleNext} className="flex-1">
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {/* Step Counter */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            {currentStep + 1} of {steps.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  };

  return { showOnboarding, setShowOnboarding, resetOnboarding };
};
