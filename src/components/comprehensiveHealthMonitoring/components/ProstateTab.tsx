import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

import type { ProstateHealthEntry } from "@/components/comprehensiveHealthMonitoring/types";

type ProstateForm = Partial<ProstateHealthEntry>;

export function ProstateTab({
  form,
  setForm,
  isLoading,
  onSave,
}: {
  form: ProstateForm;
  setForm: (next: ProstateForm) => void;
  isLoading: boolean;
  onSave: () => void;
}) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Prostate Health Tracking</CardTitle>
        <CardDescription>Track your prostate health symptoms and metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium" htmlFor="prostate-psa">
              PSA Level (ng/mL)
            </label>
            <Input
              id="prostate-psa"
              type="number"
              step="0.01"
              value={form.psa_level ?? ""}
              onChange={e =>
                setForm({ ...form, psa_level: Number.parseFloat(e.target.value) || null })
              }
              placeholder="Enter PSA level"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="prostate-pain-level">
              Pain Level (0-10)
            </label>
            <Input
              id="prostate-pain-level"
              type="number"
              min="0"
              max="10"
              value={form.pain_level ?? ""}
              onChange={e =>
                setForm({ ...form, pain_level: Number.parseInt(e.target.value, 10) || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="prostate-urination-frequency">
              Urination Frequency (per day)
            </label>
            <Input
              id="prostate-urination-frequency"
              type="number"
              value={form.urination_frequency ?? ""}
              onChange={e =>
                setForm({
                  ...form,
                  urination_frequency: Number.parseInt(e.target.value, 10) || null,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="prostate-urination-difficulty">
              Urination Difficulty
            </label>
            <Select
              value={form.urination_difficulty ?? ""}
              onValueChange={value =>
                setForm({
                  ...form,
                  urination_difficulty: value as NonNullable<
                    ProstateHealthEntry["urination_difficulty"]
                  >,
                })
              }
            >
              <SelectTrigger id="prostate-urination-difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="blood_urine"
            checked={form.blood_in_urine || false}
            onChange={e => setForm({ ...form, blood_in_urine: e.target.checked })}
          />
          <label htmlFor="blood_urine" className="text-sm">
            Blood in urine
          </label>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="prostate-notes">
            Notes
          </label>
          <Textarea
            id="prostate-notes"
            value={form.notes ?? ""}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes..."
            className="min-h-[100px]"
          />
        </div>

        <Button onClick={onSave} disabled={isLoading} className="w-full" variant="gradient">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Entry
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
