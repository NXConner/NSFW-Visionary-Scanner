import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export function TrendIcon({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  if (value > 0)
    return <TrendingUp className={`w-4 h-4 ${isPositive ? "text-green-400" : "text-red-400"}`} />;
  if (value < 0)
    return <TrendingDown className={`w-4 h-4 ${isPositive ? "text-green-400" : "text-red-400"}`} />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export function MeasurementRow({
  label,
  value,
  unit = "cm",
}: {
  label: string;
  value: number;
  unit?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-semibold">
        {value} {unit}
      </span>
    </div>
  );
}
