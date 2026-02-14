import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  LazyLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LazyRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "@/components/lazyLoaders/LazyCharts";
import { LineChart, Target } from "lucide-react";

import type { NSFWWellnessScore } from "./types";
import { calculateWellnessScore } from "@/lib/nsfwSexualWellnessAnalytics";
import { IncognitoChartFrame } from "./IncognitoChartFrame";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toPct(v: number | null | undefined): number {
  return clamp(Number(v ?? 0), 0, 100);
}

export function WellnessScoreTab({
  wellnessScores,
  incognito,
  revealed,
  onReveal,
  onDataAdded,
}: {
  wellnessScores: NSFWWellnessScore[];
  incognito: boolean;
  revealed: boolean;
  onReveal: () => void;
  onDataAdded?: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [periodDays, setPeriodDays] = useState<number>(30);

  const sorted = useMemo(() => {
    return [...wellnessScores].sort((a, b) =>
      String(a.calculation_date).localeCompare(String(b.calculation_date)),
    );
  }, [wellnessScores]);

  const latest = sorted.length ? sorted[sorted.length - 1] : null;

  const chartData = useMemo(() => {
    return sorted.map(s => ({
      date: new Date(s.calculation_date).toLocaleDateString(),
      overall: toPct(s.overall_wellness_score),
      function: toPct(s.function_score),
      libido: toPct(s.libido_score),
      satisfaction: toPct(s.satisfaction_score),
      frequency: toPct(s.frequency_score),
    }));
  }, [sorted]);

  const radarData = useMemo(() => {
    if (!latest) return [];
    return [
      { metric: "Function", value: toPct(latest.function_score) },
      { metric: "Libido", value: toPct(latest.libido_score) },
      { metric: "Satisfaction", value: toPct(latest.satisfaction_score) },
      { metric: "Frequency", value: toPct(latest.frequency_score) },
    ];
  }, [latest]);

  const handleCalculate = async () => {
    const days = clamp(Number(periodDays || 30), 7, 365);
    setSaving(true);
    try {
      const result = await calculateWellnessScore(days);
      if (!result) return;
      await onDataAdded?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Wellness Score
            </span>
            {latest ? (
              <Badge variant="secondary">
                Latest: {Math.round(toPct(latest.overall_wellness_score))}
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Calculation window (days)</Label>
              <Input
                type="number"
                min="7"
                max="365"
                value={periodDays}
                onChange={e => setPeriodDays(clamp(Number(e.target.value || 30), 7, 365))}
              />
            </div>
            <div className="sm:col-span-2 flex items-end gap-2">
              <Button onClick={handleCalculate} disabled={saving} className="w-full sm:w-auto">
                {saving ? "Calculating..." : "Calculate Score"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Generates insights + recommendations from your recent tracking data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 ? (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Wellness Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <IncognitoChartFrame incognito={incognito} revealed={revealed} onReveal={onReveal}>
              <ResponsiveContainer width="100%" height={320}>
                <LazyLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="overall" stroke="#8b5cf6" name="Overall" />
                  <Line type="monotone" dataKey="function" stroke="#10b981" name="Function" />
                  <Line type="monotone" dataKey="libido" stroke="#ef4444" name="Libido" />
                  <Line
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#f59e0b"
                    name="Satisfaction"
                  />
                  <Line type="monotone" dataKey="frequency" stroke="#06b6d4" name="Frequency" />
                </LazyLineChart>
              </ResponsiveContainer>
            </IncognitoChartFrame>

            {latest ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="glass-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Latest Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall</span>
                        <span className="tabular-nums">
                          {Math.round(toPct(latest.overall_wellness_score))}
                        </span>
                      </div>
                      <Progress value={toPct(latest.overall_wellness_score)} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Function</span>
                        <span className="tabular-nums">
                          {Math.round(toPct(latest.function_score))}
                        </span>
                      </div>
                      <Progress value={toPct(latest.function_score)} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Libido</span>
                        <span className="tabular-nums">
                          {Math.round(toPct(latest.libido_score))}
                        </span>
                      </div>
                      <Progress value={toPct(latest.libido_score)} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Satisfaction</span>
                        <span className="tabular-nums">
                          {Math.round(toPct(latest.satisfaction_score))}
                        </span>
                      </div>
                      <Progress value={toPct(latest.satisfaction_score)} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Frequency</span>
                        <span className="tabular-nums">
                          {Math.round(toPct(latest.frequency_score))}
                        </span>
                      </div>
                      <Progress value={toPct(latest.frequency_score)} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">Overview Radar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <IncognitoChartFrame
                      incognito={incognito}
                      revealed={revealed}
                      onReveal={onReveal}
                    >
                      <ResponsiveContainer width="100%" height={280}>
                        <LazyRadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar
                            name="Wellness"
                            dataKey="value"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.4}
                          />
                        </LazyRadarChart>
                      </ResponsiveContainer>
                    </IncognitoChartFrame>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {latest?.insights?.length || latest?.recommendations?.length ? (
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Insights & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <IncognitoChartFrame
                    incognito={incognito}
                    revealed={revealed}
                    onReveal={onReveal}
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Insights</h4>
                        {latest?.insights?.length ? (
                          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                            {latest.insights.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No insights generated yet.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Recommendations</h4>
                        {latest?.recommendations?.length ? (
                          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                            {latest.recommendations.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No recommendations generated yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </IncognitoChartFrame>
                </CardContent>
              </Card>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No wellness scores yet. Calculate your first score to get started.
        </div>
      )}
    </div>
  );
}
