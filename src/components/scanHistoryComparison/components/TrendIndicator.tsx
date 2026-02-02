import { memo } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export const TrendIndicator = memo(
  ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNegative = inverse ? value > 0 : value < 0;

    if (isPositive) return <TrendingUp className="w-4 h-4 text-success" />;
    if (isNegative) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  },
);

TrendIndicator.displayName = "TrendIndicator";
