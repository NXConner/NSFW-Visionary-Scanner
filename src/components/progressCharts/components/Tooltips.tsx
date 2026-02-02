import React from "react";

type TooltipEntry = {
  name?: string;
  value?: unknown;
  color?: string;
  dataKey?: unknown;
  payload?: unknown;
};

type TooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
};

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

export function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const firstPayload = payload[0]?.payload;
  const fullDate =
    isRecord(firstPayload) && typeof firstPayload.fullDate === "string"
      ? firstPayload.fullDate
      : undefined;

  return (
    <div className="glass p-3 rounded-lg border border-border/50 text-sm">
      <p className="font-medium mb-2">{fullDate || label}</p>
      {payload.map((entry, i) => {
        const name = typeof entry.name === "string" ? entry.name : "Value";
        const value =
          typeof entry.value === "number" || typeof entry.value === "string" ? entry.value : "";
        const isCurvature = name === "Curvature" || entry.dataKey === "curvatureAngle";
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{name}:</span>
            <span className="font-medium">
              {value}
              {isCurvature ? "°" : " cm"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ComparisonTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  const metric = isRecord(data) && typeof data.metric === "string" ? data.metric : "";
  const current = isRecord(data) ? data.current : undefined;
  const previous = isRecord(data) ? data.previous : undefined;
  const unit =
    isRecord(data) && (data.unit === "cm" || data.unit === "°") ? (data.unit as string) : "";

  return (
    <div className="glass p-3 rounded-lg border border-border/50 text-sm">
      <p className="font-medium mb-2">{metric}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">Current:</span>
          <span className="font-medium">
            {typeof current === "number" ? current : ""} {unit}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span className="text-muted-foreground">Previous:</span>
          <span className="font-medium">
            {typeof previous === "number" ? previous : ""} {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
