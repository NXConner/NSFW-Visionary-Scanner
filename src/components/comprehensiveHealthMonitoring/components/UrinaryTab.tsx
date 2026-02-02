import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

import type { UrinaryHealthEntry } from "@/components/comprehensiveHealthMonitoring/types";

type UrinaryForm = Partial<UrinaryHealthEntry>;

export function UrinaryTab({
  form,
  setForm,
  isLoading,
  onSave,
}: {
  form: UrinaryForm;
  setForm: (next: UrinaryForm) => void;
  isLoading: boolean;
  onSave: () => void;
}) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Urinary Health Tracking</CardTitle>
        <CardDescription>Monitor urinary function and symptoms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium" htmlFor="urinary-frequency-per-day">
              Frequency (per day)
            </label>
            <Input
              id="urinary-frequency-per-day"
              type="number"
              value={form.frequency_per_day ?? ""}
              onChange={e =>
                setForm({ ...form, frequency_per_day: Number.parseInt(e.target.value, 10) || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="urinary-urgency-level">
              Urgency Level (0-10)
            </label>
            <Input
              id="urinary-urgency-level"
              type="number"
              min="0"
              max="10"
              value={form.urgency_level ?? ""}
              onChange={e =>
                setForm({ ...form, urgency_level: Number.parseInt(e.target.value, 10) || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="urinary-nocturia-count">
              Nocturia (times per night)
            </label>
            <Input
              id="urinary-nocturia-count"
              type="number"
              value={form.nocturia_count ?? ""}
              onChange={e =>
                setForm({ ...form, nocturia_count: Number.parseInt(e.target.value, 10) || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="urinary-stream-strength">
              Stream Strength (0-10)
            </label>
            <Input
              id="urinary-stream-strength"
              type="number"
              min="0"
              max="10"
              value={form.stream_strength ?? ""}
              onChange={e =>
                setForm({ ...form, stream_strength: Number.parseInt(e.target.value, 10) || null })
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="incontinence"
              checked={form.incontinence || false}
              onChange={e => setForm({ ...form, incontinence: e.target.checked })}
            />
            <label htmlFor="incontinence" className="text-sm">
              Incontinence
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="incomplete_emptying"
              checked={form.incomplete_emptying || false}
              onChange={e => setForm({ ...form, incomplete_emptying: e.target.checked })}
            />
            <label htmlFor="incomplete_emptying" className="text-sm">
              Incomplete Emptying
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pain_urination"
              checked={form.pain_on_urination || false}
              onChange={e => setForm({ ...form, pain_on_urination: e.target.checked })}
            />
            <label htmlFor="pain_urination" className="text-sm">
              Pain on Urination
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="blood_urine_urinary"
              checked={form.blood_in_urine || false}
              onChange={e => setForm({ ...form, blood_in_urine: e.target.checked })}
            />
            <label htmlFor="blood_urine_urinary" className="text-sm">
              Blood in Urine
            </label>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="urinary-notes">
            Notes
          </label>
          <Textarea
            id="urinary-notes"
            value={form.notes ?? ""}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes..."
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
