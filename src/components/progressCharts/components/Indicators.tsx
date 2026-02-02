import React from "react";

import { Badge } from "@/components/ui/badge";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export function TrendIndicator({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNegative = inverse ? value > 0 : value < 0;

  if (isPositive) return <TrendingUp className="w-4 h-4 text-success" />;
  if (isNegative) return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export function PercentBadge({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNegative = inverse ? value > 0 : value < 0;

  return (
    <Badge
      variant="outline"
      className={`text-[10px] ${
        isPositive
          ? "text-success border-success/30 bg-success/10"
          : isNegative
            ? "text-destructive border-destructive/30 bg-destructive/10"
            : "text-muted-foreground"
      }`}
    >
      {value > 0 ? "+" : ""}
      {value}%
    </Badge>
  );
}
