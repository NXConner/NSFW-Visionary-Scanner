import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Focus, Flashlight, Gauge, Target } from "lucide-react";

export function ScannerStatusBar(props: {
  visible: boolean;
  scanType: string;
  scanMode: string;
  isStabilized: boolean;
  zoom: number;
  torchOn?: boolean;
  focusState?: "searching" | "focusing" | "locked" | "manual" | "unsupported";
  detectionsCount: number;
  aiStatus?: "idle" | "loading" | "ready" | "error";
  qualityScore?: number;
}) {
  const {
    visible,
    scanType,
    scanMode,
    isStabilized,
    zoom,
    torchOn,
    focusState,
    detectionsCount,
    aiStatus,
    qualityScore,
  } = props;

  if (!visible) return null;

  const live = scanMode === "camera" || scanMode === "countdown";

  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/95 via-background/70 to-transparent z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${live ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
          />
          <span className="text-[10px] font-mono text-foreground/80">
            {live ? "LIVE" : "READY"}
          </span>

          <Badge variant={isStabilized ? "default" : "secondary"} className="text-[9px] h-4 px-1.5">
            <Gauge className="w-2.5 h-2.5 mr-0.5" />
            {isStabilized ? "Stable" : "Stabilizing"}
          </Badge>

          {typeof qualityScore === "number" && (
            <Badge
              variant="outline"
              className="text-[9px] h-4 px-1.5 border-primary/30 text-primary"
            >
              {qualityScore}%
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/30 text-primary">
            {String(scanType).toUpperCase()}
          </Badge>

          {detectionsCount > 0 && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
              <Target className="w-2.5 h-2.5 mr-0.5" />
              {detectionsCount}
            </Badge>
          )}

          {aiStatus && aiStatus !== "idle" && (
            <Badge
              variant={aiStatus === "error" ? "destructive" : "outline"}
              className="text-[9px] h-4 px-1.5"
            >
              <BrainCircuit className="w-2.5 h-2.5 mr-0.5" />
              {aiStatus === "ready" ? "AI" : aiStatus === "loading" ? "AI…" : "AI!"}
            </Badge>
          )}

          {focusState && focusState !== "unsupported" && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
              <Focus className="w-2.5 h-2.5 mr-0.5" />
              {focusState === "locked"
                ? "Lock"
                : focusState === "focusing"
                  ? "F…"
                  : focusState === "manual"
                    ? "M"
                    : "A"}
            </Badge>
          )}

          {!!torchOn && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
              <Flashlight className="w-2.5 h-2.5 mr-0.5" />
              On
            </Badge>
          )}

          {zoom > 1 && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
              {zoom.toFixed(1)}x
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
