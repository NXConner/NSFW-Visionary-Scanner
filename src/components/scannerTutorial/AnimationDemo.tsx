import type { TutorialStep } from "./types";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle2, Hand, Sun } from "lucide-react";

export function AnimationDemo({
  step,
  animationPhase,
}: {
  step: TutorialStep;
  animationPhase: number;
}) {
  switch (step.animation) {
    case "lighting":
      return (
        <div className="relative w-full h-48 bg-gradient-to-b from-secondary to-secondary/50 rounded-xl overflow-hidden">
          <div
            className={`absolute w-12 h-12 rounded-full bg-warning transition-all duration-1000 ${
              animationPhase === 0
                ? "top-4 left-4"
                : animationPhase === 1
                  ? "top-4 left-1/2 -translate-x-1/2"
                  : animationPhase === 2
                    ? "top-4 right-4"
                    : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            }`}
          >
            <Sun className="w-full h-full p-2 text-warning-foreground" />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-24 rounded-lg bg-primary/20 border-2 border-primary/40">
            <div
              className={`absolute inset-0 transition-all duration-1000 ${
                animationPhase === 1 || animationPhase === 3 ? "bg-primary/10" : "bg-black/20"
              }`}
            />
          </div>
          <Badge
            className={`absolute bottom-2 right-2 ${animationPhase === 1 ? "bg-success" : "bg-warning"}`}
          >
            {animationPhase === 1 ? "Good Lighting" : "Adjust Light"}
          </Badge>
        </div>
      );

    case "position":
      return (
        <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden flex items-center justify-center">
          <div
            className={`relative w-20 h-36 rounded-xl border-4 border-foreground/20 bg-background transition-all duration-1000 ${
              animationPhase === 0
                ? "rotate-0"
                : animationPhase === 1
                  ? "rotate-12"
                  : animationPhase === 2
                    ? "-rotate-12"
                    : "rotate-0"
            }`}
          >
            <div className="absolute inset-2 rounded-lg bg-secondary flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-foreground/20" />
          </div>
          <div
            className={`absolute bottom-4 transition-opacity duration-500 ${
              animationPhase === 0 || animationPhase === 3 ? "opacity-100" : "opacity-50"
            }`}
          >
            <Badge
              variant={animationPhase === 0 || animationPhase === 3 ? "default" : "destructive"}
            >
              {animationPhase === 0 || animationPhase === 3 ? "✓ Correct" : "✗ Tilted"}
            </Badge>
          </div>
        </div>
      );

    case "distance":
      return (
        <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-32 flex items-end justify-center">
            <div className="w-12 h-20 rounded-t-lg bg-primary/30 border-t-2 border-x-2 border-primary" />
          </div>
          <div
            className={`absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ${
              animationPhase === 0
                ? "top-2"
                : animationPhase === 1
                  ? "top-8"
                  : animationPhase === 2
                    ? "top-16"
                    : "top-8"
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 h-32 w-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`absolute bottom-0 w-full rounded-full transition-all duration-1000 ${
                animationPhase === 1 || animationPhase === 3
                  ? "h-1/2 bg-success"
                  : animationPhase === 0
                    ? "h-1/4 bg-warning"
                    : "h-3/4 bg-destructive"
              }`}
            />
          </div>
          <Badge
            className={`absolute bottom-2 left-2 ${animationPhase === 1 || animationPhase === 3 ? "bg-success" : "bg-warning"}`}
          >
            {animationPhase === 1 || animationPhase === 3
              ? "12-18 inches ✓"
              : animationPhase === 0
                ? "Too close"
                : "Too far"}
          </Badge>
        </div>
      );

    case "stability":
      return (
        <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden flex items-center justify-center">
          <div
            className={`relative w-20 h-36 rounded-xl border-4 border-foreground/20 bg-background transition-all duration-200 ${
              animationPhase === 1 || animationPhase === 2
                ? "translate-x-1 -translate-y-0.5"
                : animationPhase === 3
                  ? "-translate-x-1 translate-y-0.5"
                  : ""
            } ${animationPhase === 0 ? "" : "animate-pulse"}`}
          >
            <div className="absolute inset-2 rounded-lg bg-secondary flex items-center justify-center">
              <Hand
                className={`w-8 h-8 ${animationPhase === 0 ? "text-success" : "text-warning"}`}
              />
            </div>
          </div>
          <Badge
            className={`absolute bottom-4 ${animationPhase === 0 ? "bg-success" : "bg-warning"}`}
          >
            {animationPhase === 0 ? "✓ Stable" : "Stabilizing..."}
          </Badge>
        </div>
      );

    case "grid":
      return (
        <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ opacity: animationPhase % 2 === 0 ? 0.6 : 0.2 }}
          >
            <line x1="33%" y1="0" x2="33%" y2="100%" stroke="hsl(var(--primary))" strokeWidth="1" />
            <line x1="66%" y1="0" x2="66%" y2="100%" stroke="hsl(var(--primary))" strokeWidth="1" />
            <line x1="0" y1="33%" x2="100%" y2="33%" stroke="hsl(var(--primary))" strokeWidth="1" />
            <line x1="0" y1="66%" x2="100%" y2="66%" stroke="hsl(var(--primary))" strokeWidth="1" />
          </svg>
          <div
            className={`absolute w-16 h-24 rounded-lg bg-primary/30 border-2 border-primary transition-all duration-1000 ${
              animationPhase === 0
                ? "top-4 left-4"
                : animationPhase === 1 || animationPhase === 2
                  ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  : "bottom-4 right-4"
            }`}
          />
          <Badge
            className={`absolute bottom-2 right-2 ${animationPhase === 1 || animationPhase === 2 ? "bg-success" : "bg-warning"}`}
          >
            {animationPhase === 1 || animationPhase === 2 ? "✓ Aligned" : "Align to grid"}
          </Badge>
        </div>
      );

    case "capture":
      return (
        <div className="relative w-full h-48 bg-secondary/30 rounded-xl overflow-hidden flex items-center justify-center">
          <div
            className={`relative transition-all duration-500 ${animationPhase === 2 ? "scale-95" : "scale-100"}`}
          >
            <div className="w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  animationPhase === 2 ? "bg-primary scale-110" : "bg-primary/20"
                }`}
              >
                <Camera
                  className={`w-10 h-10 ${animationPhase === 2 ? "text-primary-foreground" : "text-primary"}`}
                />
              </div>
            </div>
            {animationPhase === 2 && (
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />
            )}
          </div>
          {animationPhase === 3 && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          )}
        </div>
      );

    case "results":
      return (
        <div className="relative w-full h-48 bg-gradient-to-br from-success/10 to-success/5 rounded-xl overflow-hidden flex items-center justify-center">
          <div className="text-center animate-scale-in">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-2" />
            <p className="font-semibold text-success">Ready to Scan!</p>
            <p className="text-sm text-muted-foreground">You've completed the tutorial</p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
