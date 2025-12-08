import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface MeasurementConfidenceProps {
  value: number; // 0 - 100
  context?: string;
}

const getConfidenceLabel = (value: number) => {
  if (value >= 85) return { label: "Clinical-grade", tone: "success" };
  if (value >= 60) return { label: "Good", tone: "warning" };
  return { label: "Low", tone: "destructive" };
};

export const MeasurementConfidence = ({ value, context }: MeasurementConfidenceProps) => {
  const { label, tone } = getConfidenceLabel(value);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-inner">
      <div className="flex items-center gap-2">
        <ShieldCheck
          className={cn(
            "h-5 w-5",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
            tone === "destructive" && "text-destructive",
          )}
        />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Confidence
        </p>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold">{value}%</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            tone === "success" && "bg-success/15 text-success",
            tone === "warning" && "bg-warning/10 text-warning-foreground",
            tone === "destructive" && "bg-destructive/10 text-destructive",
          )}
        >
          {label}
        </span>
      </div>
      {context && <p className="mt-2 text-xs text-muted-foreground">{context}</p>}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/60">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "success" && "bg-success",
            tone === "warning" && "bg-warning",
            tone === "destructive" && "bg-destructive",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};
