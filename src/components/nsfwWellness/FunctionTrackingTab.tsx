/**
 * Sexual Function Tracking Tab
 * Refactored from NSFWSexualWellnessAnalytics.tsx
 */

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LazyLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "@/components/lazyLoaders/LazyCharts";
import { Activity, LineChart, Plus } from "lucide-react";
import { toast } from "sonner";
import type { NSFWSexualFunctionTracking, ErectionQuality } from "./types";
import { trackSexualFunction } from "@/lib/nsfwSexualWellnessAnalytics";
import { IncognitoChartFrame } from "./IncognitoChartFrame";

const erectionQualityOptions: ErectionQuality[] = ["none", "partial", "full", "rigid"];

interface FunctionTrackingTabProps {
  functionTracking: NSFWSexualFunctionTracking[];
  incognito: boolean;
  revealed: boolean;
  onReveal: () => void;
  onDataAdded?: () => void | Promise<void>;
}

function mapQualityTo10(quality: ErectionQuality | null | undefined): number {
  switch (quality) {
    case "rigid":
      return 10;
    case "full":
      return 8;
    case "partial":
      return 5;
    case "none":
    default:
      return 0;
  }
}

export const FunctionTrackingTab: React.FC<FunctionTrackingTabProps> = ({
  functionTracking,
  incognito,
  revealed,
  onReveal,
  onDataAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Partial<NSFWSexualFunctionTracking>>({
    entry_date: new Date().toISOString().split("T")[0],
    partner_present: false,
  });

  const handleSubmit = async () => {
    if (!entry.entry_date) {
      toast.error("Please select a date");
      return;
    }

    setLoading(true);
    try {
      // The Supabase-backed helper handles success/error toasts consistently.
      const result = await trackSexualFunction(entry.entry_date!, entry);
      if (!result) return;
      setEntry({ entry_date: new Date().toISOString().split("T")[0], partner_present: false });
      await onDataAdded?.();
    } catch (error) {
      // Defensive catch: normally the helper returns null and toasts itself.
      toast.error("Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const rows = functionTracking.slice(-30);
    return rows.map(r => ({
      date: new Date(r.entry_date).toLocaleDateString(),
      function: r.erectile_function_score ?? 0,
      quality: mapQualityTo10(
        r.erection_quality === "none" ||
          r.erection_quality === "partial" ||
          r.erection_quality === "full" ||
          r.erection_quality === "rigid"
          ? r.erection_quality
          : null,
      ),
      duration: r.erection_duration_minutes ?? 0,
    }));
  }, [functionTracking]);

  return (
    <div className="space-y-4">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Track Sexual Function
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={entry.entry_date ?? ""}
                onChange={e => setEntry({ ...entry, entry_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Erectile Function Score (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={entry.erectile_function_score ?? ""}
                onChange={e =>
                  setEntry({
                    ...entry,
                    erectile_function_score: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Erection Quality</Label>
              <Select
                value={(entry.erection_quality ?? "") as any}
                onValueChange={value => {
                  const v = value as ErectionQuality;
                  if (erectionQualityOptions.includes(v)) {
                    setEntry({ ...entry, erection_quality: v });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {erectionQualityOptions.map(quality => (
                    <SelectItem key={quality} value={quality}>
                      {quality.charAt(0).toUpperCase() + quality.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={entry.erection_duration_minutes ?? ""}
                onChange={e =>
                  setEntry({
                    ...entry,
                    erection_duration_minutes: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Stamina (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={entry.stamina_minutes ?? ""}
                onChange={e =>
                  setEntry({
                    ...entry,
                    stamina_minutes: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="flex items-end justify-between gap-3 rounded-xl border border-border/60 bg-secondary/10 p-3">
              <div className="space-y-1">
                <Label>Partner present</Label>
                <p className="text-xs text-muted-foreground">
                  Used for analytics; defaults to off if unknown.
                </p>
              </div>
              <Switch
                checked={Boolean(entry.partner_present)}
                onCheckedChange={checked => setEntry({ ...entry, partner_present: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={entry.notes ?? ""}
              onChange={e => setEntry({ ...entry, notes: e.target.value })}
              placeholder="Anything worth remembering (sleep, stress, hydration, etc.)"
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Tracking..." : "Track Function Data"}
          </Button>
        </CardContent>
      </Card>

      {functionTracking.length > 0 ? (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Function Trends (last 30)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IncognitoChartFrame incognito={incognito} revealed={revealed} onReveal={onReveal}>
              <ResponsiveContainer width="100%" height={300}>
                <LazyLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="function" stroke="#8b5cf6" name="Function" />
                  <Line type="monotone" dataKey="quality" stroke="#10b981" name="Quality" />
                  <Line type="monotone" dataKey="duration" stroke="#f59e0b" name="Duration" />
                </LazyLineChart>
              </ResponsiveContainer>
            </IncognitoChartFrame>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
