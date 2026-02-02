import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Loader2 } from "lucide-react";

export function MLProcessingIndicator(props: {
  status: "idle" | "loading" | "ready" | "error";
  fps: number;
  inferenceMs?: number | null;
}) {
  const { status, fps, inferenceMs } = props;

  if (status === "idle") return null;

  const isLoading = status === "loading";
  const isReady = status === "ready";
  const isError = status === "error";

  return (
    <div className="absolute top-3 left-3 z-30 pointer-events-none flex flex-col gap-1">
      <Badge
        className={
          isError
            ? "bg-destructive/90 text-destructive-foreground"
            : isReady
              ? "bg-primary/90 text-primary-foreground"
              : "bg-secondary/80 text-foreground"
        }
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <BrainCircuit className="w-3 h-3 mr-1" />
        )}
        {isError ? "AI Error" : isReady ? "AI Ready" : "Loading AI…"}
      </Badge>
      {isReady && (
        <div className="text-[10px] font-mono text-foreground/70 bg-background/60 backdrop-blur px-2 py-0.5 rounded border border-border/50">
          {fps > 0 ? `${fps} FPS` : "… FPS"}
          {typeof inferenceMs === "number" ? ` • ${Math.round(inferenceMs)}ms` : ""}
        </div>
      )}
    </div>
  );
}
