import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import type { NSFWSatisfactionTracking } from "@/lib/nsfwSexualWellnessAnalytics";
import { trackSatisfaction } from "@/lib/nsfwSexualWellnessAnalytics";
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

const satisfactionFactorKeys = [
  "comfort",
  "communication",
  "pacing",
  "confidence",
  "connection",
  "novelty",
] as const;
const dissatisfactionFactorKeys = [
  "pain",
  "stress",
  "fatigue",
  "anxiety",
  "timing",
  "distraction",
] as const;

type FactorKey =
  | (typeof satisfactionFactorKeys)[number]
  | (typeof dissatisfactionFactorKeys)[number];
type FactorsState = Partial<Record<FactorKey, boolean>>;

export function SatisfactionTab({
  data,
  loading,
  onRefresh,
}: {
  data: NSFWSatisfactionTracking[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [overall, setOverall] = useState<number | "">("");
  const [physical, setPhysical] = useState<number | "">("");
  const [emotional, setEmotional] = useState<number | "">("");
  const [partnerPresent, setPartnerPresent] = useState(false);
  const [partnerSatisfaction, setPartnerSatisfaction] = useState<number | "">("");
  const [mutualSatisfaction, setMutualSatisfaction] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [satisfactionFactors, setSatisfactionFactors] = useState<FactorsState>({});
  const [dissatisfactionFactors, setDissatisfactionFactors] = useState<FactorsState>({});

  const sorted = useMemo(
    () => [...data].sort((a, b) => String(a.entry_date).localeCompare(String(b.entry_date))),
    [data],
  );

  const last30 = useMemo(() => sorted.slice(-30), [sorted]);
  const avgOverall = useMemo(() => avg(last30.map(e => e.overall_satisfaction)), [last30]);

  const chartData = useMemo(
    () =>
      sorted.map(e => ({
        date: compactDate(e.entry_date),
        overall: e.overall_satisfaction,
        physical: e.physical_satisfaction ?? null,
        emotional: e.emotional_satisfaction ?? null,
        partner: e.partner_satisfaction ?? null,
      })),
    [sorted],
  );

  const toggleFactor = useCallback((which: "sat" | "dissat", key: FactorKey) => {
    const set = which === "sat" ? setSatisfactionFactors : setDissatisfactionFactors;
    set(prev => ({ ...prev, [key]: !prev?.[key] }));
  }, []);

  const submit = useCallback(async () => {
    const o = typeof overall === "number" ? overall : Number(overall);
    const p = typeof physical === "number" ? physical : Number(physical);
    const e = typeof emotional === "number" ? emotional : Number(emotional);
    const ps =
      typeof partnerSatisfaction === "number" ? partnerSatisfaction : Number(partnerSatisfaction);
    const ms =
      typeof mutualSatisfaction === "number" ? mutualSatisfaction : Number(mutualSatisfaction);

    if (!entryDate) {
      toast.error("Please choose a date");
      return;
    }
    if (!Number.isFinite(o) || o < 1 || o > 10) {
      toast.error("Overall satisfaction must be 1–10");
      return;
    }
    const checkOptional10 = (n: number, label: string) => {
      if (!Number.isFinite(n) || n < 1 || n > 10) throw new Error(label);
    };
    try {
      if (physical !== "") checkOptional10(p, "Physical satisfaction must be 1–10");
      if (emotional !== "") checkOptional10(e, "Emotional satisfaction must be 1–10");
      if (partnerPresent && partnerSatisfaction !== "")
        checkOptional10(ps, "Partner satisfaction must be 1–10");
      if (partnerPresent && mutualSatisfaction !== "")
        checkOptional10(ms, "Mutual satisfaction must be 1–10");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid value");
      return;
    }

    setSaving(true);
    try {
      const ok = await trackSatisfaction(entryDate, o, {
        physical_satisfaction: physical === "" ? null : p,
        emotional_satisfaction: emotional === "" ? null : e,
        partner_present: partnerPresent,
        partner_satisfaction: !partnerPresent || partnerSatisfaction === "" ? null : ps,
        mutual_satisfaction: !partnerPresent || mutualSatisfaction === "" ? null : ms,
        satisfaction_factors: factorsToJson(satisfactionFactorKeys, satisfactionFactors),
        dissatisfaction_factors: factorsToJson(dissatisfactionFactorKeys, dissatisfactionFactors),
        notes: notes.trim() ? notes.trim() : null,
      });
      if (!ok) return;

      setOverall("");
      setPhysical("");
      setEmotional("");
      setPartnerPresent(false);
      setPartnerSatisfaction("");
      setMutualSatisfaction("");
      setNotes("");
      setSatisfactionFactors({});
      setDissatisfactionFactors({});
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }, [
    dissatisfactionFactors,
    emotional,
    entryDate,
    mutualSatisfaction,
    notes,
    onRefresh,
    overall,
    partnerPresent,
    partnerSatisfaction,
    physical,
    satisfactionFactors,
  ]);

  return (
    <div className="space-y-6">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Track satisfaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Overall satisfaction (1–10)</Label>
              <Input
                inputMode="numeric"
                type="number"
                min={1}
                max={10}
                value={overall}
                onChange={e => setOverall(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Physical satisfaction (optional)</Label>
              <Input
                inputMode="numeric"
                type="number"
                min={1}
                max={10}
                value={physical}
                onChange={e => setPhysical(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Emotional satisfaction (optional)</Label>
              <Input
                inputMode="numeric"
                type="number"
                min={1}
                max={10}
                value={emotional}
                onChange={e => setEmotional(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                checked={partnerPresent}
                onCheckedChange={() => setPartnerPresent(v => !v)}
              />
              <span className="text-sm">Partner present</span>
            </div>

            {partnerPresent && (
              <>
                <div className="space-y-2">
                  <Label>Partner satisfaction (optional)</Label>
                  <Input
                    inputMode="numeric"
                    type="number"
                    min={1}
                    max={10}
                    value={partnerSatisfaction}
                    onChange={e =>
                      setPartnerSatisfaction(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mutual satisfaction (optional)</Label>
                  <Input
                    inputMode="numeric"
                    type="number"
                    min={1}
                    max={10}
                    value={mutualSatisfaction}
                    onChange={e =>
                      setMutualSatisfaction(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FactorChecklistCard
              title="What helped"
              keys={satisfactionFactorKeys}
              state={satisfactionFactors}
              onToggle={k => toggleFactor("sat", k)}
            />

            <FactorChecklistCard
              title="What hurt"
              keys={dissatisfactionFactorKeys}
              state={dissatisfactionFactors}
              onToggle={k => toggleFactor("dissat", k)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
          </div>

          <Button onClick={submit} disabled={saving} className="w-full" variant="gradient">
            {saving ? "Saving…" : "Save satisfaction entry"}
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
              {avgOverall != null && (
                <Badge variant="outline">30d avg overall: {avgOverall.toFixed(1)}/10</Badge>
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
                <Line type="monotone" dataKey="overall" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="physical" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="emotional" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="partner" stroke="#ec4899" strokeWidth={2} />
              </LazyLineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
