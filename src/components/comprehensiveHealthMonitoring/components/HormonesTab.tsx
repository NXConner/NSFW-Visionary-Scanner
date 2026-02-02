import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";

import type { HormoneLevel } from "@/components/comprehensiveHealthMonitoring/types";

type HormoneForm = Partial<HormoneLevel>;

export function HormonesTab({
  form,
  setForm,
  isLoading,
  onSave,
}: {
  form: HormoneForm;
  setForm: (next: HormoneForm) => void;
  isLoading: boolean;
  onSave: () => void;
}) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Hormone Level Tracking</CardTitle>
        <CardDescription>Record hormone test results (user-provided data)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium" htmlFor="hormones-test-date">
            Test Date
          </label>
          <Input
            id="hormones-test-date"
            type="date"
            value={form.test_date ?? ""}
            onChange={e => setForm({ ...form, test_date: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium" htmlFor="hormones-testosterone-total">
              Total Testosterone (ng/dL)
            </label>
            <Input
              id="hormones-testosterone-total"
              type="number"
              step="0.01"
              value={form.testosterone_total ?? ""}
              onChange={e =>
                setForm({ ...form, testosterone_total: Number.parseFloat(e.target.value) || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="hormones-testosterone-free">
              Free Testosterone (pg/mL)
            </label>
            <Input
              id="hormones-testosterone-free"
              type="number"
              step="0.01"
              value={form.testosterone_free ?? ""}
              onChange={e =>
                setForm({ ...form, testosterone_free: Number.parseFloat(e.target.value) || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="hormones-lh">
              LH (mIU/mL)
            </label>
            <Input
              id="hormones-lh"
              type="number"
              step="0.01"
              value={form.lh ?? ""}
              onChange={e => setForm({ ...form, lh: Number.parseFloat(e.target.value) || null })}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="hormones-fsh">
              FSH (mIU/mL)
            </label>
            <Input
              id="hormones-fsh"
              type="number"
              step="0.01"
              value={form.fsh ?? ""}
              onChange={e => setForm({ ...form, fsh: Number.parseFloat(e.target.value) || null })}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="hormones-lab-name">
            Lab Name
          </label>
          <Input
            id="hormones-lab-name"
            value={form.lab_name ?? ""}
            onChange={e => setForm({ ...form, lab_name: e.target.value })}
            placeholder="Lab or clinic name"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="hormones-notes">
            Notes
          </label>
          <Textarea
            id="hormones-notes"
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
              Save Hormone Levels
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
