import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LazyBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "@/components/lazyLoaders/LazyCharts";
import { BarChart3, CalendarRange, Plus } from "lucide-react";

import type { NSFWFrequencyTracking } from "./types";
import { trackFrequency } from "@/lib/nsfwSexualWellnessAnalytics";
import { IncognitoChartFrame } from "./IncognitoChartFrame";

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function FrequencyTrackingTab({
  frequencyTracking,
  incognito,
  revealed,
  onReveal,
  onDataAdded,
}: {
  frequencyTracking: NSFWFrequencyTracking[];
  incognito: boolean;
  revealed: boolean;
  onReveal: () => void;
  onDataAdded?: () => void | Promise<void>;
}) {
  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 6);

  const [saving, setSaving] = useState(false);
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("weekly");
  const [start, setStart] = useState<string>(() => isoDate(defaultStart));
  const [end, setEnd] = useState<string>(() => isoDate(today));
  const [solo, setSolo] = useState<number | undefined>(undefined);
  const [partner, setPartner] = useState<number | undefined>(undefined);

  const chartData = useMemo(() => {
    const rows = frequencyTracking.slice(-24);
    return rows.map(r => ({
      period: `${String(r.tracking_period_start).slice(5)}→${String(r.tracking_period_end).slice(5)}`,
      total: Number(r.total_activity_count ?? 0),
      solo: Number(r.solo_activity_count ?? 0),
      partner: Number(r.partner_activity_count ?? 0),
    }));
  }, [frequencyTracking]);

  const handleSave = async () => {
    if (!start || !end) {
      toast.error("Please select a start and end date");
      return;
    }
    if (start > end) {
      toast.error("Start date must be before end date");
      return;
    }

    const soloCount = Math.max(0, Number(solo ?? 0));
    const partnerCount = Math.max(0, Number(partner ?? 0));

    setSaving(true);
    try {
      const result = await trackFrequency(start, end, periodType, soloCount, partnerCount);
      if (!result) return;

      setSolo(undefined);
      setPartner(undefined);
      await onDataAdded?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Track Frequency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Period Type</Label>
              <Select value={periodType} onValueChange={v => setPeriodType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>End</Label>
              <Input type="date" value={end} onChange={e => setEnd(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Solo Count</Label>
              <Input
                type="number"
                min="0"
                value={solo ?? ""}
                onChange={e => setSolo(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label>Partner Count</Label>
              <Input
                type="number"
                min="0"
                value={partner ?? ""}
                onChange={e => setPartner(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Frequency Entry"}
          </Button>
        </CardContent>
      </Card>

      {frequencyTracking.length > 0 ? (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Frequency (last 24 periods)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IncognitoChartFrame incognito={incognito} revealed={revealed} onReveal={onReveal}>
              <ResponsiveContainer width="100%" height={320}>
                <LazyBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" hide={false} interval="preserveStartEnd" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="solo" stackId="a" fill="#8b5cf6" name="Solo" />
                  <Bar dataKey="partner" stackId="a" fill="#ef4444" name="Partner" />
                </LazyBarChart>
              </ResponsiveContainer>
            </IncognitoChartFrame>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
