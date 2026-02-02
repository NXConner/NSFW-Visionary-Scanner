import { memo } from "react";
import type { TooltipProps } from "recharts";

type PayloadItem = NonNullable<NonNullable<TooltipProps<number, string>["payload"]>[number]>;

function isPayloadItem(v: unknown): v is PayloadItem {
  return Boolean(v) && typeof v === "object";
}

function getFullDateFromPayloadItem(item: PayloadItem): string | null {
  const p = (item as unknown as { payload?: unknown }).payload;
  if (!p || typeof p !== "object") return null;
  const fullDate = (p as Record<string, unknown>)["fullDate"];
  return typeof fullDate === "string" ? fullDate : null;
}

export const CustomTooltip = memo((props: TooltipProps<number, string>): JSX.Element | null => {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;

  const firstPayload = payload[0] as unknown;
  const fullDate =
    isPayloadItem(firstPayload) && getFullDateFromPayloadItem(firstPayload)
      ? (getFullDateFromPayloadItem(firstPayload) as string)
      : typeof label === "string"
        ? label
        : "";

  return (
    <div className="glass p-3 rounded-lg border border-border/50 text-sm shadow-xl">
      <p className="font-medium mb-2 text-primary">{fullDate}</p>
      {payload.map((entry, i) => {
        const e = entry as unknown as {
          name?: unknown;
          color?: unknown;
          value?: unknown;
          dataKey?: unknown;
        };
        const name = typeof e.name === "string" ? e.name : `Series ${i + 1}`;
        const color = typeof e.color === "string" ? e.color : "hsl(var(--muted-foreground))";
        const value = typeof e.value === "number" ? e.value : null;
        const dataKey = typeof e.dataKey === "string" ? e.dataKey : "";
        const unit = dataKey.includes("curvature") || dataKey.includes("Angle") ? "°" : " cm";

        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{name}:</span>
            <span className="font-medium font-mono">
              {value == null ? "—" : `${value.toFixed(1)}${unit}`}
            </span>
          </div>
        );
      })}
    </div>
  );
});

CustomTooltip.displayName = "CustomTooltip";
