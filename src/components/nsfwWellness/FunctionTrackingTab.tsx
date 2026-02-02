/**
 * Sexual Function Tracking Tab
 * Refactored from NSFWSexualWellnessAnalytics.tsx
 */

import React, { useState } from "react";
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
import { Activity, Plus } from "lucide-react";
import { toast } from "sonner";
import type { NSFWSexualFunctionTracking, ErectionQuality } from "./types";
import { trackSexualFunction } from "@/lib/nsfwSexualWellnessAnalytics";

const erectionQualityOptions: ErectionQuality[] = ["none", "partial", "full", "rigid"];

interface FunctionTrackingTabProps {
  onDataAdded?: () => void;
}

export const FunctionTrackingTab: React.FC<FunctionTrackingTabProps> = ({ onDataAdded }) => {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Partial<NSFWSexualFunctionTracking>>({
    entry_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async () => {
    if (!entry.entry_date) {
      toast.error("Please select a date");
      return;
    }

    setLoading(true);
    try {
      await trackSexualFunction(entry.entry_date!, entry);
      toast.success("Function data tracked successfully");
      setEntry({ entry_date: new Date().toISOString().split("T")[0] });
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
            <Label>Erectile Function Score (0-10)</Label>
            <Input
              type="number"
              min="0"
              max="10"
              value={entry.erectile_function_score ?? ""}
              onChange={e =>
                setEntry({ ...entry, erectile_function_score: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Erection Quality</Label>
            <Select
              value={entry.erection_quality}
              onValueChange={value =>
                setEntry({ ...entry, erection_quality: value as ErectionQuality })
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
                setEntry({ ...entry, erection_duration_minutes: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Stamina (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={entry.stamina_minutes ?? ""}
              onChange={e => setEntry({ ...entry, stamina_minutes: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Satisfaction Score (0-10)</Label>
            <Input
              type="number"
              min="0"
              max="10"
              value={entry.satisfaction_score ?? ""}
              onChange={e => setEntry({ ...entry, satisfaction_score: Number(e.target.value) })}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          {loading ? "Tracking..." : "Track Function Data"}
        </Button>
      </CardContent>
    </Card>
  );
};
