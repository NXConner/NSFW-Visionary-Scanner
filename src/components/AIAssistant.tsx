import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Lightbulb,
  Camera,
  Ruler,
  Sun,
  Move,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";

interface AITip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  type: "positioning" | "lighting" | "stability" | "measurement";
}

const tips: AITip[] = [
  {
    id: "position",
    icon: <Move className="w-4 h-4" />,
    title: "Optimal Positioning",
    description:
      "Position the subject within the center frame markers for best accuracy. Use the measurement grid overlay.",
    type: "positioning",
  },
  {
    id: "lighting",
    icon: <Sun className="w-4 h-4" />,
    title: "Good Lighting",
    description:
      "Ensure even lighting without harsh shadows. Natural light or diffused artificial light works best.",
    type: "lighting",
  },
  {
    id: "stability",
    icon: <Camera className="w-4 h-4" />,
    title: "Keep Steady",
    description:
      "Hold the device steady for 2-3 seconds. Use the timer feature for hands-free capture.",
    type: "stability",
  },
  {
    id: "ruler",
    icon: <Ruler className="w-4 h-4" />,
    title: "Reference Object",
    description:
      "For more accurate measurements, include a reference object of known size in the frame.",
    type: "measurement",
  },
];

interface AIAssistantProps {
  isActive: boolean;
  onDismiss?: () => void;
  currentPhase?: "idle" | "camera" | "scanning" | "complete";
  isStabilized?: boolean;
}

export const AIAssistant = ({
  isActive,
  onDismiss,
  currentPhase = "idle",
  isStabilized = false,
}: AIAssistantProps) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([
    "position",
    "lighting",
    "stability",
    "ruler",
    "scanning",
    "complete",
  ]);

  useEffect(() => {
    if (isActive && currentPhase === "camera") {
      const interval = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % tips.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isActive, currentPhase]);

  const getContextualTip = () => {
    if (!isActive) return null;

    switch (currentPhase) {
      case "camera":
        return tips[currentTipIndex];
      case "scanning":
        return {
          id: "scanning",
          icon: <Brain className="w-4 h-4 animate-pulse" />,
          title: "AI Analysis in Progress",
          description:
            "Our AI is analyzing morphology, measuring dimensions, and calculating curvature angles.",
          type: "measurement" as const,
        };
      case "complete":
        return {
          id: "complete",
          icon: <CheckCircle2 className="w-4 h-4" />,
          title: "Analysis Complete",
          description: "Review your measurements and save to your health diary for tracking.",
          type: "measurement" as const,
        };
      default:
        return tips[0];
    }
  };

  const tip = getContextualTip();
  if (!tip || dismissed.includes(tip.id)) return null;

  const handleDismiss = () => {
    setDismissed(prev => [...prev, tip.id]);
    onDismiss?.();
  };

  return (
    <Card className="absolute top-2 left-1/2 -translate-x-1/2 w-[calc(100%-8rem)] max-w-sm z-20 bg-background/95 backdrop-blur-lg border-primary/20 shadow-lg shadow-primary/10 animate-fade-in">
      <CardContent className="p-2.5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-primary/10 border-primary/20 text-primary"
              >
                AI TIP
              </Badge>
              <span className="text-sm font-medium">{tip.title}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Stability Indicator */}
        {currentPhase === "camera" && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <div
              className={`w-2 h-2 rounded-full ${isStabilized ? "bg-success animate-pulse" : "bg-warning"}`}
            />
            <span className="text-xs text-muted-foreground">
              {isStabilized ? "Device stable - ready to capture" : "Stabilizing..."}
            </span>
          </div>
        )}

        {/* Tips Navigation */}
        {currentPhase === "camera" && (
          <div className="flex items-center justify-center gap-1 mt-3">
            {tips.map((tip, tipIndex) => (
              <button
                key={tip.id}
                type="button"
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  tipIndex === currentTipIndex ? "bg-primary" : "bg-muted"
                }`}
                onClick={() => setCurrentTipIndex(tipIndex)}
                aria-label={`Show tip ${tipIndex + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Floating AI Tips Component
export const AIFloatingTips = () => {
  const [showTips, setShowTips] = useState(true);

  if (!showTips) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 animate-fade-in">
      <Card className="w-72 bg-background/95 backdrop-blur-lg border-primary/20 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Quick Tips</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowTips(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <ul className="space-y-2">
            {tips.slice(0, 3).map((tip, index) => (
              <li key={tip.id} className="flex items-start gap-2 text-xs">
                <ChevronRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{tip.description.split(".")[0]}.</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
