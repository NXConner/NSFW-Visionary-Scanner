import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  LazyLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "@/components/lazyLoaders/LazyCharts";
import { LineChart, Smile, Plus } from "lucide-react";

import type { NSFWSatisfactionTracking } from "./types";
import { trackSatisfaction } from "@/lib/nsfwSexualWellnessAnalytics";
import { IncognitoChartFrame } from "./IncognitoChartFrame";

export function SatisfactionTrackingTab({
  satisfactionTracking,
  incognito,
  revealed,
  onReveal,
  onDataAdded,
}: {
  satisfactionTracking: NSFWSatisfactionTracking[];
  incognito: boolean;
  revealed: boolean;
  onReveal: () => void;
  onDataAdded?: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [partnerPresent, setPartnerPresent] = useState(false);
  const [activityType, setActivityType] = useState<string>("");
  const [overall, setOverall] = useState<number | undefined>(undefined);
  const [physical, setPhysical] = useState<number | undefined>(undefined);
  const [emotional, setEmotional] = useState<number | undefined>(undefined);
  const [partner, setPartner] = useState<number | undefined>(undefined);
  const [mutual, setMutual] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");

  const chartData = useMemo(() => {
    const rows = satisfactionTracking.slice(-60);
    return rows.map(r => ({
      date: new Date(r.entry_date).toLocaleDateString(),
      overall: Number(r.overall_satisfaction ?? 0),
      physical: Number(r.physical_satisfaction ?? 0),
      emotional: Number(r.emotional_satisfaction ?? 0),
    }));
  }, [satisfactionTracking]);

  const handleSave = async () => {
    if (!entryDate) {
      toast.error("Please select a date");
      return;
    }
    if (!overall || !Number.isFinite(overall)) {
      toast.error("Please enter an overall satisfaction score (1-10)");
      return;
    }

    setSaving(true);
    try {
      const result = await trackSatisfaction(entryDate, overall, {
        partner_present: partnerPresent,
        activity_type: activityType || null,
        physical_satisfaction: physical ?? null,
        emotional_satisfaction: emotional ?? null,
        partner_satisfaction: partner ?? null,
        mutual_satisfaction: mutual ?? null,
        notes: notes || null,
      });
      if (!result) return;

      setEntryDate(new Date().toISOString().split("T")[0]);
      setPartnerPresent(false);
      setActivityType("");
      setOverall(undefined);
      setPhysical(undefined);
      setEmotional(undefined);
      setPartner(undefined);
      setMutual(undefined);
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
            <Smile className="h-5 w-5" />
            Track Satisfaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Overall Satisfaction (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={overall ?? ""}
                onChange={e => setOverall(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label>Physical Satisfaction (1-10, optional)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={physical ?? ""}
                onChange={e => setPhysical(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label>Emotional Satisfaction (1-10, optional)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={emotional ?? ""}
                onChange={e => setEmotional(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label>Partner Satisfaction (1-10, optional)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={partner ?? ""}
                onChange={e => setPartner(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mutual Satisfaction (1-10, optional)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={mutual ?? ""}
                onChange={e => setMutual(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Activity Type (optional)</Label>
              <Input
                value={activityType}
                onChange={e => setActivityType(e.target.value)}
                placeholder='e.g. "solo", "partner", "intercourse", "intimacy"'
              />
            </div>

            <div className="flex items-end justify-between gap-3 rounded-xl border border-border/60 bg-secondary/10 p-3 sm:col-span-2">
              <div className="space-y-1">
                <Label>Partner present</Label>
                <p className="text-xs text-muted-foreground">
                  Helps differentiate solo vs partner experiences.
                </p>
              </div>
              <Switch checked={partnerPresent} onCheckedChange={setPartnerPresent} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What worked well? What didn’t?"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Satisfaction Entry"}
          </Button>
        </CardContent>
      </Card>

      {satisfactionTracking.length > 0 ? (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Satisfaction Trends (last 60)
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
                  <Line type="monotone" dataKey="overall" stroke="#f59e0b" name="Overall" />
                  <Line type="monotone" dataKey="physical" stroke="#8b5cf6" name="Physical" />
                  <Line type="monotone" dataKey="emotional" stroke="#10b981" name="Emotional" />
                </LazyLineChart>
              </ResponsiveContainer>
            </IncognitoChartFrame>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
