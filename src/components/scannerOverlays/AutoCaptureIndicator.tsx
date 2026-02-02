import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ScanSearch, Zap } from "lucide-react";

interface AutoCaptureIndicatorProps {
  // Back-compat
  isReady?: boolean;
  countdown?: number;
  onCancel: () => void;
  status?: {
    phase:
      | "idle"
      | "waiting_detection"
      | "object_detected"
      | "stabilizing"
      | "optimal"
      | "countdown"
      | "capturing";
    countdown?: number;
    message?: string;
  };
}

export const AutoCaptureIndicator = ({
  isReady,
  countdown,
  onCancel,
  status,
}: AutoCaptureIndicatorProps) => {
  const phase =
    status?.phase ?? (countdown && countdown > 0 ? "countdown" : isReady ? "optimal" : "idle");
  const effectiveCountdown = status?.countdown ?? countdown ?? 0;

  if (phase === "idle") return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      {phase === "countdown" && effectiveCountdown > 0 ? (
        <div className="text-center animate-scale-in">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="46%"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeDasharray={`${(effectiveCountdown / 5) * 289} 289`}
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold gradient-text">{effectiveCountdown}</span>
            </div>
          </div>
          <p className="text-sm font-medium text-primary mt-2">
            {status?.message ?? "Capturing in…"}
          </p>
          <Button variant="ghost" size="sm" className="mt-2 pointer-events-auto" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : phase === "waiting_detection" ? (
        <Badge className="bg-secondary/80 text-foreground animate-pulse">
          <ScanSearch className="w-3 h-3 mr-1" />
          {status?.message ?? "Waiting for detection…"}
        </Badge>
      ) : phase === "object_detected" ? (
        <Badge className="bg-primary/15 text-primary border border-primary/30 animate-pulse">
          <Zap className="w-3 h-3 mr-1" />
          {status?.message ?? "Object detected"}
        </Badge>
      ) : phase === "stabilizing" ? (
        <Badge className="bg-warning/15 text-warning border border-warning/30">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          {status?.message ?? "Stabilizing…"}
        </Badge>
      ) : phase === "capturing" ? (
        <Badge className="bg-primary/90 text-primary-foreground">
          <Zap className="w-3 h-3 mr-1" />
          {status?.message ?? "Capturing…"}
        </Badge>
      ) : phase === "optimal" ? (
        <Badge className="bg-success/90 text-success-foreground animate-pulse">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {status?.message ?? "Optimal conditions"}
        </Badge>
      ) : null}
    </div>
  );
};
