import { useState, useEffect } from "react";
import { Scan } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AppLoadingScreenProps {
  message?: string;
  showProgress?: boolean;
}

export const AppLoadingScreen = ({
  message = "Loading MorphoScan Pro...",
  showProgress = true,
}: AppLoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);

  // Simulated progress animation
  useEffect(() => {
    if (!showProgress) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [showProgress]);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 150);
      }
    }, 2000);
    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Scanner Icon Container */}
        <div
          className={`relative transition-transform duration-100 ${glitchActive ? "translate-x-0.5" : ""}`}
        >
          {/* Outer glow */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/40 via-primary/20 to-transparent blur-2xl scale-150" />

          {/* Rotating ring */}
          <div
            className="absolute -inset-4 rounded-full border border-primary/40"
            style={{ animation: "spin 8s linear infinite" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
          </div>

          {/* Second rotating ring (opposite direction) */}
          <div
            className="absolute -inset-8 rounded-full border border-primary/20"
            style={{ animation: "spin 12s linear infinite reverse" }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-primary/60 rounded-full" />
          </div>

          {/* Pulsing background glow */}
          <div
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"
            style={{ animationDuration: "2s" }}
          />

          {/* Main scanner icon */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
            <Scan
              className="h-16 w-16 text-primary drop-shadow-[0_0_20px_hsl(var(--primary))]"
              style={{ filter: "drop-shadow(0 0 15px hsl(var(--primary)))" }}
            />

            {/* Scan line animation */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                style={{ animation: "scanVertical 2s ease-in-out infinite" }}
              />
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-primary/60" />
          <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-primary/60" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-primary/60" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-primary/60" />
        </div>

        {/* Status text */}
        <div className="text-center space-y-3">
          <p className="text-sm font-mono text-primary tracking-wider">{message}</p>

          {/* Progress bar */}
          {showProgress && (
            <div className="w-48 space-y-1">
              <Progress value={progress} className="h-1.5 bg-primary/20" />
              <p className="text-[10px] font-mono text-muted-foreground text-center">
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        {/* Bottom status indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-primary/60">
          <span>SYS:NOMINAL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>v2.1.0</span>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes scanVertical {
          0%, 100% { top: 0%; opacity: 0.3; }
          10% { opacity: 1; }
          50% { top: 100%; opacity: 1; }
          90% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
