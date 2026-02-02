import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import type { SexualWellnessEntry, SexualWellnessEntryDraft } from "../types";

export function EntryTab({
  loading,
  entry,
  onChange,
  onSubmit,
}: {
  loading: boolean;
  entry: SexualWellnessEntryDraft;
  onChange: (next: SexualWellnessEntryDraft) => void;
  onSubmit: () => void;
}): JSX.Element {
  const activityType = (entry.activity_type ?? "none") as NonNullable<
    SexualWellnessEntry["activity_type"]
  >;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          New Wellness Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="entry_date">Date</Label>
          <Input
            id="entry_date"
            type="date"
            value={entry.entry_date || ""}
            onChange={e => onChange({ ...entry, entry_date: e.target.value })}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Sexual Function</h3>

            <div>
              <Label htmlFor="ef_score">Erectile Function (0-10)</Label>
              <Input
                id="ef_score"
                type="number"
                min="0"
                max="10"
                value={entry.erectile_function_score ?? ""}
                onChange={e =>
                  onChange({
                    ...entry,
                    erectile_function_score: parseInt(e.target.value, 10) || undefined,
                  })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ej_score">Ejaculation Quality (0-10)</Label>
              <Input
                id="ej_score"
                type="number"
                min="0"
                max="10"
                value={entry.ejaculation_quality_score ?? ""}
                onChange={e =>
                  onChange({
                    ...entry,
                    ejaculation_quality_score: parseInt(e.target.value, 10) || undefined,
                  })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="stamina_min">Stamina (minutes)</Label>
              <Input
                id="stamina_min"
                type="number"
                min="0"
                value={entry.stamina_duration_minutes ?? ""}
                onChange={e =>
                  onChange({
                    ...entry,
                    stamina_duration_minutes: parseInt(e.target.value, 10) || undefined,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Libido &amp; Satisfaction</h3>

            <div>
              <Label htmlFor="libido_level">Libido Level (0-10)</Label>
              <Input
                id="libido_level"
                type="number"
                min="0"
                max="10"
                value={entry.libido_level ?? ""}
                onChange={e =>
                  onChange({ ...entry, libido_level: parseInt(e.target.value, 10) || undefined })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="satisfaction">Overall Satisfaction (0-10)</Label>
              <Input
                id="satisfaction"
                type="number"
                min="0"
                max="10"
                value={entry.overall_satisfaction ?? ""}
                onChange={e =>
                  onChange({
                    ...entry,
                    overall_satisfaction: parseInt(e.target.value, 10) || undefined,
                  })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confidence">Sexual Confidence (0-10)</Label>
              <Input
                id="confidence"
                type="number"
                min="0"
                max="10"
                value={entry.sexual_confidence ?? ""}
                onChange={e =>
                  onChange({
                    ...entry,
                    sexual_confidence: parseInt(e.target.value, 10) || undefined,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="activity_type">Activity Type</Label>
          <select
            id="activity_type"
            value={activityType}
            onChange={e =>
              onChange({
                ...entry,
                activity_type: e.target.value as NonNullable<SexualWellnessEntry["activity_type"]>,
              })
            }
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="none">None</option>
            <option value="intercourse">Intercourse</option>
            <option value="masturbation">Masturbation</option>
            <option value="oral">Oral</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <Label htmlFor="activity_count">Activity Count</Label>
          <Input
            id="activity_count"
            type="number"
            min="0"
            value={entry.sexual_activity_count ?? 0}
            onChange={e =>
              onChange({ ...entry, sexual_activity_count: parseInt(e.target.value, 10) || 0 })
            }
            className="mt-1"
          />
        </div>

        <Button onClick={onSubmit} disabled={loading} className="w-full" variant="gradient">
          {loading ? "Saving..." : "Save Entry"}
        </Button>
      </CardContent>
    </Card>
  );
}
