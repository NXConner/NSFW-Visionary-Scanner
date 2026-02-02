import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatCardProps } from "../types";
import { TrendIndicator } from "./TrendIndicator";

export const StatCard = memo(
  ({
    icon: Icon,
    label,
    value,
    unit,
    change,
    formatValue,
    formatChange,
    inverse = false,
    color = "primary",
  }: StatCardProps) => {
    const colorClasses: Record<NonNullable<StatCardProps["color"]>, string> = {
      primary: "text-primary bg-primary/10",
      accent: "text-accent bg-accent/10",
      success: "text-success bg-success/10",
    };

    const changeClass =
      change > 0
        ? inverse
          ? "text-destructive"
          : "text-success"
        : change < 0
          ? inverse
            ? "text-success"
            : "text-destructive"
          : "text-muted-foreground";

    return (
      <Card className="glass-card border-border/50 hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <TrendIndicator value={change} inverse={inverse} />
          </div>
          <div className="text-2xl font-bold">
            {formatValue ? formatValue(value) : `${value.toFixed(1)}${unit ?? ""}`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
          <div className={`text-xs mt-2 ${changeClass}`}>
            {formatChange
              ? formatChange(change)
              : `${change > 0 ? "+" : ""}${change.toFixed(1)} ${unit ?? ""} from baseline`}
          </div>
        </CardContent>
      </Card>
    );
  },
);

StatCard.displayName = "StatCard";
