import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Heart, LineChart, Plus } from "lucide-react";

import type { NSFWLibidoTracking } from "./types";
import { trackLibido } from "@/lib/nsfwSexualWellnessAnalytics";
import { IncognitoChartFrame } from "./IncognitoChartFrame";

export function LibidoTrackingTab({
  libidoTracking,
  incognito,
  revealed,
  onReveal,
  onDataAdded,
}: {
  libidoTracking: NSFWLibidoTracking[];
  incognito: boolean;
  revealed: boolean;
  onReveal: () => void;
  onDataAdded?: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [libidoLevel, setLibidoLevel] = useState<number | undefined>(undefined);
  const [direction, setDirection] = useState<NSFWLibidoTracking["libido_direction"]>(null);
  const [desireIntensity, setDesireIntensity] = useState<number | undefined>(undefined);
  const [desireFrequency, setDesireFrequency] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const chartData = useMemo(() => {
    const rows = libidoTracking.slice(-60);
    return rows.map(r => ({
      date: new Date(r.entry_date).toLocaleDateString(),
      libido: Number(r.libido_level ?? 0),
      intensity: Number(r.desire_intensity ?? 0),
    }));
  }, [libidoTracking]);

  const handleSave = async () => {
    if (!entryDate) {
      toast.error("Please select a date");
      return;
    }
    if (!libidoLevel || !Number.isFinite(libidoLevel)) {
      toast.error("Please enter a libido level (1-10)");
      return;
    }

    setSaving(true);
    try {
      const result = await trackLibido(entryDate, libidoLevel, {
        libido_direction: direction,
        desire_intensity: desireIntensity ?? null,
        desire_frequency: desireFrequency || null,
        notes: notes || null,
      });
      if (!result) return;

      setEntryDate(new Date().toISOString().split("T")[0]);
      setLibidoLevel(undefined);
      setDirection(null);
      setDesireIntensity(undefined);
      setDesireFrequency("");
      setNotes("");
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
            <Heart className="h-5 w-5" />
            Track Libido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Libido Level (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={libidoLevel ?? ""}
                onChange={e => setLibidoLevel(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label>Trend Direction (optional)</Label>
              <Select value={direction ?? ""} onValueChange={v => setDirection((v as any) || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="increasing">Increasing</SelectItem>
                  <SelectItem value="decreasing">Decreasing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Desire Intensity (1-10, optional)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={desireIntensity ?? ""}
                onChange={e =>
                  setDesireIntensity(e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Desire Frequency (optional)</Label>
              <Input
                value={desireFrequency}
                onChange={e => setDesireFrequency(e.target.value)}
                placeholder='e.g. "daily", "a few times/week"'
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Stress, sleep, meds, lifestyle changes, etc."
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Libido Entry"}
          </Button>
        </CardContent>
      </Card>

      {libidoTracking.length > 0 ? (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Libido Trends (last 60)
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
                  <Line type="monotone" dataKey="libido" stroke="#ef4444" name="Libido" />
                  <Line type="monotone" dataKey="intensity" stroke="#f59e0b" name="Intensity" />
                </LazyLineChart>
              </ResponsiveContainer>
            </IncognitoChartFrame>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
