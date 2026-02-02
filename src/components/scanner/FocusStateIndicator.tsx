import { Badge } from "@/components/ui/badge";
import { Focus, CheckCircle2, ScanSearch, SlidersHorizontal } from "lucide-react";

export type FocusVisualState = "searching" | "focusing" | "locked" | "manual" | "unsupported";

export function FocusStateIndicator(props: {
  state: FocusVisualState;
  modeLabel?: string;
  focusDistanceMm?: number | null;
}) {
  const { state, modeLabel, focusDistanceMm } = props;

  if (state === "unsupported") {
    return (
      <div className="absolute top-3 right-3 z-30 pointer-events-none">
        <Badge variant="secondary" className="text-[10px] h-5 px-2">
          <Focus className="w-3 h-3 mr-1" />
          Focus N/A
        </Badge>
      </div>
    );
  }

  const cfg =
    state === "locked"
      ? {
          icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
          label: "Focus Locked",
          cls: "bg-success/90 text-success-foreground",
        }
      : state === "focusing"
        ? {
            icon: <Focus className="w-3 h-3 mr-1 animate-pulse" />,
            label: "Focusing…",
            cls: "bg-primary/15 text-primary border border-primary/30",
          }
        : state === "manual"
          ? {
              icon: <SlidersHorizontal className="w-3 h-3 mr-1" />,
              label: "Manual Focus",
              cls: "bg-accent/15 text-accent border border-accent/30",
            }
          : {
              icon: <ScanSearch className="w-3 h-3 mr-1 animate-pulse" />,
              label: "Searching…",
              cls: "bg-secondary/60 text-foreground",
            };

  return (
    <div className="absolute top-3 right-3 z-30 pointer-events-none flex flex-col items-end gap-1">
      <Badge className={`text-[10px] h-5 px-2 ${cfg.cls}`}>
        {cfg.icon}
        {cfg.label}
      </Badge>
      {(modeLabel || focusDistanceMm != null) && (
        <div className="text-[10px] font-mono text-foreground/70 bg-background/60 backdrop-blur px-2 py-0.5 rounded border border-border/50">
          {modeLabel ? <span className="mr-2">{modeLabel}</span> : null}
          {focusDistanceMm != null ? <span>{focusDistanceMm.toFixed(0)}mm</span> : null}
        </div>
      )}
    </div>
  );
}
