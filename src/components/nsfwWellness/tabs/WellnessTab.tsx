import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import type {
  NSFWFrequencyTracking,
  NSFWLibidoTracking,
  NSFWSatisfactionTracking,
  NSFWSexualFunctionTracking,
  NSFWWellnessScore,
} from "@/lib/nsfwSexualWellnessAnalytics";
import { calculateWellnessScore } from "@/lib/nsfwSexualWellnessAnalytics";
import { WellnessCharts } from "@/components/nsfwWellness/WellnessCharts";
import {
  CartesianGrid,
  LazyLineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/lazyLoaders/LazyCharts";

function compactDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function WellnessTab({
  functionData,
  libidoData,
  satisfactionData,
  frequencyData,
  wellnessScores,
  loading,
  onRefresh,
}: {
  functionData: NSFWSexualFunctionTracking[];
  libidoData: NSFWLibidoTracking[];
  satisfactionData: NSFWSatisfactionTracking[];
  frequencyData: NSFWFrequencyTracking[];
  wellnessScores: NSFWWellnessScore[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);

  const sortedScores = useMemo(
    () =>
      [...wellnessScores].sort((a, b) =>
        String(a.calculated_at).localeCompare(String(b.calculated_at)),
      ),
    [wellnessScores],
  );

  const latest = sortedScores.length > 0 ? sortedScores[sortedScores.length - 1] : null;

  const scoreProgress = useMemo(() => {
    const v = latest?.overall_wellness_score;
    if (typeof v !== "number" || !Number.isFinite(v)) return 0;
    return clamp01(v / 100) * 100;
  }, [latest?.overall_wellness_score]);

  const chartData = useMemo(
    () =>
      sortedScores.slice(-18).map(s => ({
        date: compactDate(s.calculation_date),
        overall: s.overall_wellness_score,
        function: s.function_score ?? null,
        libido: s.libido_score ?? null,
        satisfaction: s.satisfaction_score ?? null,
        frequency: s.frequency_score ?? null,
      })),
    [sortedScores],
  );

  const calculate = useCallback(async () => {
    setSaving(true);
    try {
      const res = await calculateWellnessScore(periodDays);
      if (!res) return;
      toast.success("Wellness score calculated");
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }, [onRefresh, periodDays]);

  return (
    <div className="space-y-6">
      <Card className="glass-card border-border/50">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Wellness score</CardTitle>
            <CardDescription>
              Calculates a 0–100 score using your recent function, libido, satisfaction, and
              frequency signals.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(periodDays)} onValueChange={v => setPeriodDays(Number(v))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={calculate} disabled={saving || loading} variant="gradient">
              {saving ? "Calculating…" : "Calculate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/50">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Latest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {latest ? (
                  <>
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-semibold">
                        {latest.overall_wellness_score.toFixed(1)}
                      </div>
                      <Badge variant="secondary">{latest.score_trend ?? "—"}</Badge>
                    </div>
                    <Progress value={scoreProgress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {latest.calculation_date} • {latest.calculation_period_days} day window
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No score yet. Calculate your first score to establish a baseline.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Data inputs (recent)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Function</span>
                  <span className="text-muted-foreground">{functionData.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Libido</span>
                  <span className="text-muted-foreground">{libidoData.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Satisfaction</span>
                  <span className="text-muted-foreground">{satisfactionData.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frequency</span>
                  <span className="text-muted-foreground">{frequencyData.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {latest?.insights && latest.insights.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {latest.insights.slice(0, 6).map((i, idx) => (
                      <li key={`${idx}-${i}`}>{i}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">No insights available yet.</div>
                )}
                {latest?.recommendations && latest.recommendations.length > 0 ? (
                  <div className="pt-2 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Recommendations
                    </div>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {latest.recommendations.slice(0, 6).map((r, idx) => (
                        <li key={`${idx}-${r}`}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Score trends</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length < 2 ? (
            <div className="py-10 text-center text-muted-foreground">
              Calculate at least two scores to visualize trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LazyLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="overall" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="function" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="libido" stroke="#ec4899" strokeWidth={2} />
                <Line type="monotone" dataKey="satisfaction" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="frequency" stroke="#06b6d4" strokeWidth={2} />
              </LazyLineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <WellnessCharts functionData={functionData} wellnessScores={sortedScores} />
    </div>
  );
}
