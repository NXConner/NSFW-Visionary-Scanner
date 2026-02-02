import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

import type { TesticularHealthEntry } from "@/components/comprehensiveHealthMonitoring/types";

type TesticularForm = Partial<TesticularHealthEntry>;

export function TesticularTab({
  form,
  setForm,
  isLoading,
  onSave,
}: {
  form: TesticularForm;
  setForm: (next: TesticularForm) => void;
  isLoading: boolean;
  onSave: () => void;
}) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Testicular Health Tracking</CardTitle>
        <CardDescription>Track self-examinations and testicular health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="self_exam"
            checked={form.self_exam_performed || false}
            onChange={e => setForm({ ...form, self_exam_performed: e.target.checked })}
          />
          <label htmlFor="self_exam" className="text-sm">
            Self-examination performed
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="abnormalities"
            checked={form.abnormalities_found || false}
            onChange={e => setForm({ ...form, abnormalities_found: e.target.checked })}
          />
          <label htmlFor="abnormalities" className="text-sm">
            Abnormalities found
          </label>
        </div>

        {form.abnormalities_found && (
          <div>
            <label className="text-sm font-medium" htmlFor="testicular-abnormality-description">
              Abnormality Description
            </label>
            <Textarea
              id="testicular-abnormality-description"
              value={form.abnormality_description ?? ""}
              onChange={e => setForm({ ...form, abnormality_description: e.target.value })}
              placeholder="Describe any abnormalities..."
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium" htmlFor="testicular-pain-level">
              Pain Level (0-10)
            </label>
            <Input
              id="testicular-pain-level"
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
            <label className="text-sm font-medium" htmlFor="testicular-notes">
              Notes
            </label>
            <Textarea
              id="testicular-notes"
              value={form.notes ?? ""}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
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
