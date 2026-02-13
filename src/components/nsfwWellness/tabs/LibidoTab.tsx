import { useCallback, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import type { NSFWLibidoTracking } from "@/lib/nsfwSexualWellnessAnalytics";
import { trackLibido } from "@/lib/nsfwSexualWellnessAnalytics";
import { avg, compactDate, factorsToJson } from "./tabUtils";
import { FactorChecklistCard } from "./FactorChecklistCard";
import {
  CartesianGrid,
  LazyLineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/lazyLoaders/LazyCharts";

const contributingFactorKeys = [
  "sleep",
  "exercise",
  "recovery",
  "connection",
  "novelty",
  "low_stress",
  "healthy_food",
] as const;

const inhibitingFactorKeys = [
  "stress",
  "fatigue",
  "anxiety",
  "pain",
  "alcohol",
  "overtraining",
] as const;

type FactorKey = (typeof contributingFactorKeys)[number] | (typeof inhibitingFactorKeys)[number];
type FactorsState = Partial<Record<FactorKey, boolean>>;

export function LibidoTab({
  data,
  loading,
  onRefresh,
}: {
  data: NSFWLibidoTracking[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [libidoLevel, setLibidoLevel] = useState<number | "">("");
  const [desireIntensity, setDesireIntensity] = useState<number | "">("");
  const [direction, setDirection] = useState<NSFWLibidoTracking["libido_direction"]>(null);
  const [frequency, setFrequency] = useState<NSFWLibidoTracking["desire_frequency"]>(null);
  const [notes, setNotes] = useState("");
  const [contributing, setContributing] = useState<FactorsState>({});
  const [inhibiting, setInhibiting] = useState<FactorsState>({});

  const sorted = useMemo(
    () => [...data].sort((a, b) => String(a.entry_date).localeCompare(String(b.entry_date))),
    [data],
  );

  const last30 = useMemo(() => sorted.slice(-30), [sorted]);
  const avgLibido = useMemo(() => avg(last30.map(e => e.libido_level)), [last30]);
  const avgDesire = useMemo(() => avg(last30.map(e => e.desire_intensity)), [last30]);

  const chartData = useMemo(
    () =>
      sorted.map(e => ({
        date: compactDate(e.entry_date),
        libido: e.libido_level,
        desire: e.desire_intensity ?? null,
      })),
    [sorted],
  );

  const toggleFactor = useCallback(
    (which: "contributing" | "inhibiting", key: FactorKey) => {
      const set = which === "contributing" ? setContributing : setInhibiting;
      set(prev => ({ ...prev, [key]: !prev?.[key] }));
    },
    [setContributing, setInhibiting],
  );

  const submit = useCallback(async () => {
    const level = typeof libidoLevel === "number" ? libidoLevel : Number(libidoLevel);
    const desire = typeof desireIntensity === "number" ? desireIntensity : Number(desireIntensity);

    if (!entryDate) {
      toast.error("Please choose a date");
      return;
    }
    if (!Number.isFinite(level) || level < 1 || level > 10) {
      toast.error("Libido level must be 1–10");
      return;
    }
    if (desireIntensity !== "" && (!Number.isFinite(desire) || desire < 1 || desire > 10)) {
      toast.error("Desire intensity must be 1–10");
      return;
    }

    setSaving(true);
    try {
      const ok = await trackLibido(entryDate, level, {
        libido_direction: direction,
        desire_frequency: frequency,
        desire_intensity: desireIntensity === "" ? null : desire,
        contributing_factors: factorsToJson(contributingFactorKeys, contributing),
        inhibiting_factors: factorsToJson(inhibitingFactorKeys, inhibiting),
        notes: notes.trim() ? notes.trim() : null,
      });
      if (!ok) return;
      setLibidoLevel("");
      setDesireIntensity("");
      setDirection(null);
      setFrequency(null);
      setNotes("");
      setContributing({});
      setInhibiting({});
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }, [
    contributing,
    desireIntensity,
    direction,
    entryDate,
    frequency,
    inhibiting,
    libidoLevel,
    notes,
    onRefresh,
  ]);

  return (
    <div className="space-y-6">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Track libido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Libido level (1–10)</Label>
              <Input
                inputMode="numeric"
                type="number"
                min={1}
                max={10}
                value={libidoLevel}
                onChange={e => setLibidoLevel(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Desire intensity (optional)</Label>
              <Input
                inputMode="numeric"
                type="number"
                min={1}
                max={10}
                value={desireIntensity}
                onChange={e =>
                  setDesireIntensity(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Direction (optional)</Label>
              <Select
                value={direction ?? ""}
                onValueChange={v => setDirection(v ? (v as any) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increasing">Increasing</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="decreasing">Decreasing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Desire frequency (optional)</Label>
              <Select
                value={frequency ?? ""}
                onValueChange={v => setFrequency(v ? (v as any) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_daily">Multiple times daily</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="few_times_week">A few times/week</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="less_often">Less often</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FactorChecklistCard
              title="Contributing factors"
              keys={contributingFactorKeys}
              state={contributing}
              onToggle={k => toggleFactor("contributing", k)}
            />

            <FactorChecklistCard
              title="Inhibiting factors"
              keys={inhibitingFactorKeys}
              state={inhibiting}
              onToggle={k => toggleFactor("inhibiting", k)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
          </div>

          <Button onClick={submit} disabled={saving} className="w-full" variant="gradient">
            {saving ? "Saving…" : "Save libido entry"}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Trends</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {loading ? "Updating…" : `${sorted.length} entries`}
              </Badge>
              {avgLibido != null && (
                <Badge variant="outline">30d avg libido: {avgLibido.toFixed(1)}/10</Badge>
              )}
              {avgDesire != null && (
                <Badge variant="outline">30d avg desire: {avgDesire.toFixed(1)}/10</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length < 2 ? (
            <div className="py-10 text-center text-muted-foreground">
              Add at least two entries to visualize trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LazyLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="libido" stroke="#ec4899" strokeWidth={2} />
                <Line type="monotone" dataKey="desire" stroke="#f59e0b" strokeWidth={2} />
              </LazyLineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
