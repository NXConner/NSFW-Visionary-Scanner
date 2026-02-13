import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import type { NSFWFrequencyTracking } from "@/lib/nsfwSexualWellnessAnalytics";
import { trackFrequency } from "@/lib/nsfwSexualWellnessAnalytics";
import {
  Bar,
  CartesianGrid,
  LazyBarChart,
  LazyLineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/lazyLoaders/LazyCharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function compactDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

function daysBetweenInclusive(startIso: string, endIso: string): number | null {
  try {
    const s = new Date(`${startIso}T00:00:00Z`).getTime();
    const e = new Date(`${endIso}T00:00:00Z`).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e)) return null;
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : null;
  } catch {
    return null;
  }
}

export function FrequencyTab({
  data,
  loading,
  onRefresh,
}: {
  data: NSFWFrequencyTracking[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [periodType, setPeriodType] = useState<NSFWFrequencyTracking["period_type"]>("weekly");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [soloCount, setSoloCount] = useState<number | "">(0);
  const [partnerCount, setPartnerCount] = useState<number | "">(0);
  const [targetPerWeek, setTargetPerWeek] = useState<number | "">("");

  const sorted = useMemo(
    () =>
      [...data].sort((a, b) =>
        String(a.tracking_period_end).localeCompare(String(b.tracking_period_end)),
      ),
    [data],
  );

  const chartData = useMemo(
    () =>
      sorted.map(e => ({
        date: compactDate(e.tracking_period_end),
        total: e.total_activity_count ?? 0,
        avgPerWeek: e.average_per_week ?? null,
      })),
    [sorted],
  );

  const recentAvgPerWeek = useMemo(() => {
    const last6 = sorted.slice(-6);
    const nums = last6
      .map(e => e.average_per_week)
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }, [sorted]);

  const submit = useCallback(async () => {
    const solo = typeof soloCount === "number" ? soloCount : Number(soloCount);
    const partner = typeof partnerCount === "number" ? partnerCount : Number(partnerCount);
    const target = typeof targetPerWeek === "number" ? targetPerWeek : Number(targetPerWeek);

    if (!startDate || !endDate) {
      toast.error("Please choose a start and end date");
      return;
    }
    const days = daysBetweenInclusive(startDate, endDate);
    if (!days) {
      toast.error("Invalid period dates");
      return;
    }
    if (!Number.isFinite(solo) || solo < 0 || solo > 1000) {
      toast.error("Solo count must be a valid number");
      return;
    }
    if (!Number.isFinite(partner) || partner < 0 || partner > 1000) {
      toast.error("Partner count must be a valid number");
      return;
    }

    const total = solo + partner;
    const average_per_week = Number(((total / days) * 7).toFixed(2));
    const average_per_month = Number(((total / days) * 30).toFixed(2));
    const target_frequency_per_week =
      targetPerWeek === "" ? null : Number.isFinite(target) && target >= 0 ? target : null;
    const goal_achieved =
      target_frequency_per_week != null ? average_per_week >= target_frequency_per_week : false;

    const prev = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const prevAvg = prev?.average_per_week ?? null;
    const delta = prevAvg != null ? average_per_week - prevAvg : null;
    const frequency_trend: NSFWFrequencyTracking["frequency_trend"] =
      delta == null
        ? null
        : Math.abs(delta) < 0.25
          ? "stable"
          : delta > 0
            ? "increasing"
            : "decreasing";
    const trend_strength = delta == null ? null : Math.max(0, Math.min(1, Math.abs(delta) / 2)); // 0..1

    setSaving(true);
    try {
      const ok = await trackFrequency(startDate, endDate, {
        period_type: periodType,
        solo_activity_count: solo,
        partner_activity_count: partner,
        total_activity_count: total,
        average_per_week,
        average_per_month,
        frequency_trend,
        trend_strength,
        target_frequency_per_week,
        goal_achieved,
        // notes is not a column in this table; store in a JSON future migration.
      } as Partial<NSFWFrequencyTracking>);
      if (!ok) return;
      setSoloCount(0);
      setPartnerCount(0);
      setTargetPerWeek("");
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }, [endDate, onRefresh, partnerCount, periodType, soloCount, sorted, startDate, targetPerWeek]);

  return (
    <div className="space-y-6">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Track frequency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period type</Label>
              <Select value={periodType} onValueChange={v => setPeriodType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target per week (optional)</Label>
              <Input
                inputMode="decimal"
                type="number"
                min={0}
                step={0.1}
                value={targetPerWeek}
                onChange={e =>
                  setTargetPerWeek(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g., 2"
              />
            </div>

            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Solo count</Label>
              <Input
                inputMode="numeric"
                type="number"
                min={0}
                value={soloCount}
                onChange={e => setSoloCount(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Partner count</Label>
              <Input
                inputMode="numeric"
                type="number"
                min={0}
                value={partnerCount}
                onChange={e => setPartnerCount(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <Button onClick={submit} disabled={saving} className="w-full" variant="gradient">
            {saving ? "Saving…" : "Save frequency entry"}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Trends</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {loading ? "Updating…" : `${sorted.length} periods`}
              </Badge>
              {recentAvgPerWeek != null && (
                <Badge variant="outline">Recent avg/week: {recentAvgPerWeek.toFixed(2)}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {chartData.length < 2 ? (
            <div className="py-10 text-center text-muted-foreground">
              Add at least two periods to visualize trends.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <LazyBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#8b5cf6" />
                </LazyBarChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height={260}>
                <LazyLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgPerWeek" stroke="#10b981" strokeWidth={2} />
                </LazyLineChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
