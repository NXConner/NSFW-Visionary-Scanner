import { ArrowDown, ArrowUp } from "lucide-react";

interface DistanceIndicatorProps {
  estimatedDistance: number; // in inches
  optimalMin: number;
  optimalMax: number;
  external?: boolean; // When true, renders without absolute positioning
}

export const DistanceIndicator = ({
  estimatedDistance,
  optimalMin = 12,
  optimalMax = 18,
  external = false,
}: DistanceIndicatorProps) => {
  const hasEstimate = Number.isFinite(estimatedDistance) && estimatedDistance > 0;
  const isOptimal =
    hasEstimate && estimatedDistance >= optimalMin && estimatedDistance <= optimalMax;
  const isTooClose = hasEstimate && estimatedDistance < optimalMin;
  const isTooFar = hasEstimate && estimatedDistance > optimalMax;

  const content = (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/90 backdrop-blur-md border border-border/50 shadow-lg">
      <div className="flex flex-col items-center gap-0.5">
        <ArrowUp
          className={`w-4 h-4 transition-colors ${
            isTooClose ? "text-warning animate-bounce" : "text-muted-foreground/30"
          }`}
        />
        <div className="h-16 w-2 rounded-full bg-muted overflow-hidden relative">
          <div
            className={`absolute bottom-0 w-full rounded-full transition-all ${
              !hasEstimate
                ? "bg-muted-foreground/30"
                : isOptimal
                  ? "bg-success"
                  : isTooClose
                    ? "bg-warning"
                    : "bg-destructive"
            }`}
            style={{
              height: hasEstimate
                ? `${Math.min(Math.max((estimatedDistance / 24) * 100, 10), 100)}%`
                : "10%",
            }}
          />
          {hasEstimate && (
            <>
              <div
                className="absolute left-0 right-0 h-px bg-success/50"
                style={{ bottom: `${(optimalMin / 24) * 100}%` }}
              />
              <div
                className="absolute left-0 right-0 h-px bg-success/50"
                style={{ bottom: `${(optimalMax / 24) * 100}%` }}
              />
            </>
          )}
        </div>
        <ArrowDown
          className={`w-4 h-4 transition-colors ${
            isTooFar ? "text-destructive animate-bounce" : "text-muted-foreground/30"
          }`}
        />
      </div>
      <span
        className={`text-[8px] ${
          !hasEstimate ? "text-muted-foreground" : isOptimal ? "text-success" : "text-warning"
        }`}
      >
        {!hasEstimate ? "N/A" : isOptimal ? "GOOD" : isTooClose ? "CLOSER" : "FARTHER"}
      </span>
    </div>
  );

  if (external) return content;

  return <div className="absolute left-2 bottom-24 z-10">{content}</div>;
};
