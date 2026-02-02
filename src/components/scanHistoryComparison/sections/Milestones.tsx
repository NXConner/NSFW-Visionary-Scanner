import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

export function Milestones({
  totalEntries,
  daysCovered,
  curvatureFirst,
  curvatureLast,
}: {
  totalEntries: number;
  daysCovered: number;
  curvatureFirst: number;
  curvatureLast: number;
}): JSX.Element {
  const curvatureReductionPct =
    curvatureFirst > 0 && curvatureLast > 0
      ? Math.round(((curvatureFirst - curvatureLast) / curvatureFirst) * 100)
      : 0;

  const perWeek = daysCovered > 0 ? Math.round((totalEntries / daysCovered) * 7) : 0;

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="w-4 h-4 text-warning" />
          Progress Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-center">
            <div className="text-3xl font-bold gradient-text">{totalEntries}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Entries</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 text-center">
            <div className="text-3xl font-bold text-accent">{daysCovered}</div>
            <div className="text-xs text-muted-foreground mt-1">Days Tracked</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 text-center">
            <div className="text-3xl font-bold text-success">{curvatureReductionPct}%</div>
            <div className="text-xs text-muted-foreground mt-1">Curvature Reduction</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 text-center">
            <div className="text-3xl font-bold text-warning">{perWeek}</div>
            <div className="text-xs text-muted-foreground mt-1">Avg per Week</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
