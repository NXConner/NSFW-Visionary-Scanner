/**
 * Sexual Function Tracking Tab
 * Refactored from NSFWSexualWellnessAnalytics.tsx
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Plus } from "lucide-react";
import { toast } from "sonner";
import type { NSFWSexualFunctionTracking, ErectionQuality } from "./types";
import { trackSexualFunction } from "@/lib/nsfwSexualWellnessAnalytics";

const erectionQualityOptions: ErectionQuality[] = ["none", "partial", "full", "rigid"];
const activityTypeOptions: Array<NonNullable<NSFWSexualFunctionTracking["activity_type"]>> = [
  "solo",
  "partner",
  "both",
];

const factorKeys = ["stress", "fatigue", "alcohol", "pain", "illness", "sleep"] as const;
type FactorKey = (typeof factorKeys)[number];
type FactorsState = Partial<Record<FactorKey, boolean>>;

interface FunctionTrackingTabProps {
  onDataAdded?: () => void;
}

export const FunctionTrackingTab: React.FC<FunctionTrackingTabProps> = ({ onDataAdded }) => {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Partial<NSFWSexualFunctionTracking>>({
    entry_date: new Date().toISOString().split("T")[0],
  });
  const [factors, setFactors] = useState<FactorsState>({});

  const toggleFactor = (k: FactorKey) => setFactors(prev => ({ ...prev, [k]: !prev?.[k] }));

  const handleSubmit = async () => {
    if (!entry.entry_date) {
      toast.error("Please select a date");
      return;
    }

    const score = entry.erectile_function_score;
    if (score != null && (!Number.isFinite(score) || score < 1 || score > 10)) {
      toast.error("Erectile function score must be 1–10");
      return;
    }
    const stability = entry.erection_stability;
    if (stability != null && (!Number.isFinite(stability) || stability < 1 || stability > 10)) {
      toast.error("Stability must be 1–10");
      return;
    }
    const control = entry.control_level;
    if (control != null && (!Number.isFinite(control) || control < 1 || control > 10)) {
      toast.error("Control level must be 1–10");
      return;
    }

    setLoading(true);
    try {
      const filteredFactors = Object.fromEntries(
        Object.entries(factors).filter(([, v]) => v === true),
      ) as Record<string, boolean>;
      const factors_affecting = Object.keys(filteredFactors).length > 0 ? filteredFactors : null;

      const res = await trackSexualFunction(entry.entry_date!, {
        ...entry,
        factors_affecting,
      });
      if (!res) return;
      setEntry({ entry_date: new Date().toISOString().split("T")[0] });
      setFactors({});
      onDataAdded?.();
    } catch (error) {
      toast.error("Failed to track function data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Track Sexual Function
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={entry.entry_date}
              onChange={e => setEntry({ ...entry, entry_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Erectile Function Score (1–10)</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={entry.erectile_function_score ?? ""}
              onChange={e =>
                setEntry({
                  ...entry,
                  erectile_function_score: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Erection Quality</Label>
            <Select
              value={entry.erection_quality ?? ""}
              onValueChange={value =>
                setEntry({ ...entry, erection_quality: value ? (value as ErectionQuality) : null })
              }
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
                  erection_duration_minutes: e.target.value === "" ? null : Number(e.target.value),
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
                  stamina_minutes: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Stability (optional, 1–10)</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={entry.erection_stability ?? ""}
              onChange={e =>
                setEntry({
                  ...entry,
                  erection_stability: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Control (optional, 1–10)</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={entry.control_level ?? ""}
              onChange={e =>
                setEntry({
                  ...entry,
                  control_level: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Recovery time (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={entry.recovery_time_minutes ?? ""}
              onChange={e =>
                setEntry({
                  ...entry,
                  recovery_time_minutes: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Activity type</Label>
            <Select
              value={entry.activity_type ?? ""}
              onValueChange={value =>
                setEntry({
                  ...entry,
                  activity_type: value ? (value as any) : null,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypeOptions.map(t => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <Checkbox
              checked={entry.partner_present === true}
              onCheckedChange={() =>
                setEntry({
                  ...entry,
                  partner_present: !(entry.partner_present === true),
                })
              }
            />
            <span className="text-sm">Partner present</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {factorKeys.map(k => (
            <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={factors[k] === true} onCheckedChange={() => toggleFactor(k)} />
              <span className="capitalize">{k.replaceAll("_", " ")}</span>
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            rows={4}
            value={entry.notes ?? ""}
            onChange={e => setEntry({ ...entry, notes: e.target.value })}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          {loading ? "Tracking..." : "Track Function Data"}
        </Button>
      </CardContent>
    </Card>
  );
};
