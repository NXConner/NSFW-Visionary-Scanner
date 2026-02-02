import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

import type { SexualHealthEntry } from "@/components/comprehensiveHealthMonitoring/types";

type SexualForm = Partial<SexualHealthEntry>;

export function SexualTab({
  form,
  setForm,
  isLoading,
  onSave,
}: {
  form: SexualForm;
  setForm: (next: SexualForm) => void;
  isLoading: boolean;
  onSave: () => void;
}) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Sexual Health Tracking</CardTitle>
        <CardDescription>Monitor sexual function, libido, and satisfaction</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium" htmlFor="sexual-erectile-function">
              Erectile Function (0-10)
            </label>
            <Input
              id="sexual-erectile-function"
              type="number"
              min="0"
              max="10"
              value={form.erectile_function_score ?? ""}
              onChange={e =>
                setForm({
                  ...form,
                  erectile_function_score: Number.parseInt(e.target.value, 10) || null,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="sexual-libido-level">
              Libido Level (0-10)
            </label>
            <Input
              id="sexual-libido-level"
              type="number"
              min="0"
              max="10"
              value={form.libido_level ?? ""}
              onChange={e =>
                setForm({ ...form, libido_level: Number.parseInt(e.target.value, 10) || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="sexual-satisfaction-level">
              Satisfaction (0-10)
            </label>
            <Input
              id="sexual-satisfaction-level"
              type="number"
              min="0"
              max="10"
              value={form.satisfaction_level ?? ""}
              onChange={e =>
                setForm({
                  ...form,
                  satisfaction_level: Number.parseInt(e.target.value, 10) || null,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="sexual-frequency-per-week">
              Frequency (per week)
            </label>
            <Input
              id="sexual-frequency-per-week"
              type="number"
              value={form.frequency_per_week ?? ""}
              onChange={e =>
                setForm({
                  ...form,
                  frequency_per_week: Number.parseInt(e.target.value, 10) || null,
                })
              }
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="sexual-notes">
            Notes
          </label>
          <Textarea
            id="sexual-notes"
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
