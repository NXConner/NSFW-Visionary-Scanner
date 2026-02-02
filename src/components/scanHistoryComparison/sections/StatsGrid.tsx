import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CircleDot, Ruler, Target, Zap } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { useSettings } from "@/contexts/SettingsContext";
import { formatLength } from "@/lib/measurementsComparison";

export type StatsSummary = {
  length: { avg: number; change: number };
  circumference: { avg: number; change: number };
  curvature: { avg: number; change: number; first: number; last: number };
  totalEntries: number;
  daysCovered: number;
};

export function StatsGrid({
  stats,
  rateOfChange,
}: {
  stats: StatsSummary;
  rateOfChange: { length: number; circumference: number; curvature: number };
}): JSX.Element {
  const { measurementUnits } = useSettings();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Ruler}
        label="Length"
        value={stats.length.avg}
        change={stats.length.change}
        formatValue={v => formatLength(v, measurementUnits)}
        formatChange={c => `${c > 0 ? "+" : ""}${formatLength(c, measurementUnits)} from baseline`}
        color="primary"
      />
      <StatCard
        icon={CircleDot}
        label="Circumference"
        value={stats.circumference.avg}
        change={stats.circumference.change}
        formatValue={v => formatLength(v, measurementUnits)}
        formatChange={c => `${c > 0 ? "+" : ""}${formatLength(c, measurementUnits)} from baseline`}
        color="accent"
      />
      <StatCard
        icon={Target}
        label="Curvature"
        value={stats.curvature.avg}
        unit="°"
        change={stats.curvature.change}
        inverse
        color="success"
      />
      <Card className="glass-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <Zap className="w-4 h-4" />
            </div>
            <Badge variant="outline" className="text-[10px]">
              per month
            </Badge>
          </div>
          <div className="text-2xl font-bold">
            {rateOfChange.length > 0 ? "+" : ""}
            {formatLength(rateOfChange.length, measurementUnits)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Growth Rate</div>
        </CardContent>
      </Card>
    </div>
  );
}
