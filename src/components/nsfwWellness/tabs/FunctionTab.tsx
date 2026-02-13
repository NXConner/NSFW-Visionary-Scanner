import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FunctionTrackingTab } from "@/components/nsfwWellness/FunctionTrackingTab";
import type { NSFWSexualFunctionTracking } from "@/lib/nsfwSexualWellnessAnalytics";
import {
  CartesianGrid,
  LazyLineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/lazyLoaders/LazyCharts";

function qualityTo10(q: NSFWSexualFunctionTracking["erection_quality"]): number | null {
  if (!q) return null;
  if (q === "none") return 0;
  if (q === "partial") return 5;
  if (q === "full") return 8;
  if (q === "rigid") return 10;
  return null;
}

function compactDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

function avg(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function FunctionTab({
  data,
  loading,
  onRefresh,
}: {
  data: NSFWSexualFunctionTracking[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}): JSX.Element {
  const sorted = useMemo(
    () => [...data].sort((a, b) => String(a.entry_date).localeCompare(String(b.entry_date))),
    [data],
  );

  const chartData = useMemo(
    () =>
      sorted.map(e => ({
        date: compactDate(e.entry_date),
        function: e.erectile_function_score ?? null,
        stability: e.erection_stability ?? null,
        quality: qualityTo10(e.erection_quality),
        stamina: e.stamina_minutes ?? null,
      })),
    [sorted],
  );

  const last7 = useMemo(() => sorted.slice(-7), [sorted]);
  const avgFunction = useMemo(() => avg(last7.map(e => e.erectile_function_score)), [last7]);
  const avgStability = useMemo(() => avg(last7.map(e => e.erection_stability)), [last7]);
  const avgStamina = useMemo(() => avg(last7.map(e => e.stamina_minutes)), [last7]);

  return (
    <div className="space-y-6">
      <FunctionTrackingTab onDataAdded={onRefresh} />

      <Card className="glass-card border-border/50">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Function trends</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {loading ? "Updating…" : `${sorted.length} entries`}
              </Badge>
              {avgFunction != null && (
                <Badge variant="outline">7d avg function: {avgFunction.toFixed(1)}/10</Badge>
              )}
              {avgStability != null && (
                <Badge variant="outline">7d avg stability: {avgStability.toFixed(1)}/10</Badge>
              )}
              {avgStamina != null && (
                <Badge variant="outline">7d avg stamina: {avgStamina.toFixed(1)} min</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length < 2 ? (
            <div className="py-10 text-center text-muted-foreground">
              Track at least two entries to visualize trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LazyLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="function" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="stability" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="quality" stroke="#f59e0b" strokeWidth={2} />
              </LazyLineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
