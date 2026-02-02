import { Card, CardContent } from "@/components/ui/card";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { SexualWellnessStatistics } from "../types";

function getScoreColor(score?: number): string {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

function TrendIcon({ trend }: { trend: SexualWellnessStatistics["trend"] }): JSX.Element {
  switch (trend) {
    case "improving":
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case "declining":
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
}

export function OverviewStats({
  statistics,
}: {
  statistics: SexualWellnessStatistics | null;
}): JSX.Element | null {
  if (!statistics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Wellness Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(statistics.averageWellnessScore)}`}>
                {statistics.averageWellnessScore.toFixed(1)}
              </p>
            </div>
            <TrendIcon trend={statistics.trend} />
          </div>
        </CardContent>
      </Card>
      <Card variant="glass">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Erectile Function</p>
          <p className={`text-2xl font-bold ${getScoreColor(statistics.averageErectileFunction)}`}>
            {statistics.averageErectileFunction.toFixed(1)}
          </p>
        </CardContent>
      </Card>
      <Card variant="glass">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Libido Level</p>
          <p className={`text-2xl font-bold ${getScoreColor(statistics.averageLibido)}`}>
            {statistics.averageLibido.toFixed(1)}
          </p>
        </CardContent>
      </Card>
      <Card variant="glass">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Activities</p>
          <p className="text-2xl font-bold">{statistics.totalActivities}</p>
        </CardContent>
      </Card>
    </div>
  );
}
