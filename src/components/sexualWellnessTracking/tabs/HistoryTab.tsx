import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SexualWellnessEntry } from "../types";

function getScoreColor(score?: number): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

export function HistoryTab({ entries }: { entries: SexualWellnessEntry[] }): JSX.Element {
  const chartData = entries
    .slice(0, 30)
    .reverse()
    .map(e => ({
      date: new Date(e.entry_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      wellness: Number(e.wellness_score || 0) / 10,
      erectile: e.erectile_function_score || 0,
      libido: e.libido_level || 0,
      satisfaction: e.overall_satisfaction || 0,
    }));

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Wellness History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="wellness"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Wellness (0-10)"
                />
                <Line
                  type="monotone"
                  dataKey="erectile"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Erectile Function"
                />
                <Line
                  type="monotone"
                  dataKey="libido"
                  stroke="#ffc658"
                  strokeWidth={2}
                  name="Libido"
                />
                <Line
                  type="monotone"
                  dataKey="satisfaction"
                  stroke="#ff7300"
                  strokeWidth={2}
                  name="Satisfaction"
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {entries.slice(0, 10).map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">{new Date(entry.entry_date).toLocaleDateString()}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      {entry.erectile_function_score != null && (
                        <span>EF: {entry.erectile_function_score}/10</span>
                      )}
                      {entry.libido_level != null && <span>Libido: {entry.libido_level}/10</span>}
                      {entry.overall_satisfaction != null && (
                        <span>Satisfaction: {entry.overall_satisfaction}/10</span>
                      )}
                    </div>
                  </div>
                  {entry.wellness_score != null && (
                    <Badge className={getScoreColor(Number(entry.wellness_score))}>
                      {Number(entry.wellness_score).toFixed(1)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No entries yet. Start tracking your sexual wellness today!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
