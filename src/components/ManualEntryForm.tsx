import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { formatLength } from "@/lib/measurementsComparison";
import { Checkbox } from "@/components/ui/checkbox";
import type { MeasurementMethod, MeasurementState, TimeOfDay } from "@/lib/growersVsShowers";
import { z } from "zod";
import { Plus, Ruler, CircleDot, Target, Save, X, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const measurementSchema = z
  .object({
    length: z
      .number()
      .min(1, "Length must be at least 1cm")
      .max(30, "Length must be less than 30cm"),
    circumference: z
      .number()
      .min(1, "Circumference must be at least 1cm")
      .max(25, "Circumference must be less than 25cm"),
    measurementState: z.enum(["unknown", "flaccid", "erect", "paired"]),
    method: z.enum(["unknown", "bone-pressed", "non-bone-pressed"]).optional(),
    timeOfDay: z.enum(["unknown", "morning", "afternoon", "evening", "night"]).optional(),
    temperatureC: z.number().min(-20).max(60).nullable().optional(),
    pumpRecent: z.boolean().optional(),
    erectLength: z
      .number()
      .min(1, "Erect length must be at least 1cm")
      .max(30, "Erect length must be less than 30cm")
      .nullable()
      .optional(),
    erectCircumference: z
      .number()
      .min(1, "Erect circumference must be at least 1cm")
      .max(25, "Erect circumference must be less than 25cm")
      .nullable()
      .optional(),
    curvatureAngle: z
      .number()
      .min(0, "Angle must be 0 or more")
      .max(90, "Angle must be 90° or less"),
    curvatureDirection: z.string().min(1, "Please select a direction"),
    painLevel: z.number().min(0).max(10),
    notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.measurementState === "paired") {
      if (!val.erectLength || !Number.isFinite(val.erectLength)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["erectLength"],
          message: "Erect length is required for paired entries",
        });
      }
      if (!val.erectCircumference || !Number.isFinite(val.erectCircumference)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["erectCircumference"],
          message: "Erect circumference is required for paired entries",
        });
      }
    }
  });

interface ManualEntryFormProps {
  onSuccess?: () => void;
}

export const ManualEntryForm = ({ onSuccess }: ManualEntryFormProps) => {
  const { measurementUnits } = useSettings();
  const [open, setOpen] = useState(false);
  const [length, setLength] = useState("");
  const [circumference, setCircumference] = useState("");
  const [measurementState, setMeasurementState] = useState<MeasurementState>("unknown");
  const [method, setMethod] = useState<MeasurementMethod>("unknown");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("unknown");
  const [temperatureC, setTemperatureC] = useState("");
  const [pumpRecent, setPumpRecent] = useState(false);
  const [erectLength, setErectLength] = useState("");
  const [erectCircumference, setErectCircumference] = useState("");
  const [curvatureAngle, setCurvatureAngle] = useState("");
  const [curvatureDirection, setCurvatureDirection] = useState("");
  const [painLevel, setPainLevel] = useState([0]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { saveScan, saveDiaryEntry } = useData();

  const directions = [
    { value: "dorsal", label: "Dorsal (upward)" },
    { value: "ventral", label: "Ventral (downward)" },
    { value: "lateral-left", label: "Lateral (left)" },
    { value: "lateral-right", label: "Lateral (right)" },
    { value: "none", label: "No curvature" },
  ];

  const resetForm = () => {
    setLength("");
    setCircumference("");
    setMeasurementState("unknown");
    setMethod("unknown");
    setTimeOfDay("unknown");
    setTemperatureC("");
    setPumpRecent(false);
    setErectLength("");
    setErectCircumference("");
    setCurvatureAngle("");
    setCurvatureDirection("");
    setPainLevel([0]);
    setNotes("");
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const data = {
      length: parseFloat(length) || 0,
      circumference: parseFloat(circumference) || 0,
      measurementState,
      method,
      timeOfDay,
      temperatureC: (() => {
        if (!temperatureC.trim()) return null;
        const n = Number.parseFloat(temperatureC);
        return Number.isFinite(n) ? n : (Number.NaN as unknown as number);
      })(),
      pumpRecent,
      erectLength: erectLength.trim() ? parseFloat(erectLength) || 0 : null,
      erectCircumference: erectCircumference.trim() ? parseFloat(erectCircumference) || 0 : null,
      curvatureAngle: parseFloat(curvatureAngle) || 0,
      curvatureDirection,
      painLevel: painLevel[0],
      notes: notes.trim(),
    };

    const result = measurementSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Save as scan entry
    saveScan({
      scan_type: "manual",
      length: data.length,
      circumference: data.circumference,
      erect_length: data.erectLength,
      erect_circumference: data.erectCircumference,
      measurement_context: {
        state: data.measurementState,
        method: data.method,
        timeOfDay: data.timeOfDay,
        temperatureC: data.temperatureC,
        pumpRecent: data.pumpRecent,
      },
      curvature_angle: data.curvatureAngle,
      curvature_direction:
        directions.find(d => d.value === data.curvatureDirection)?.label || data.curvatureDirection,
      image_data: null,
      notes: data.notes || null,
    });

    // Also save as diary entry with pain level
    saveDiaryEntry({
      entry_date: new Date().toISOString().split("T")[0],
      length: data.length,
      circumference: data.circumference,
      curvature_angle: data.curvatureAngle,
      curvature_direction:
        directions.find(d => d.value === data.curvatureDirection)?.label || data.curvatureDirection,
      pain_level: data.painLevel,
      symptoms: [],
      notes: data.notes || null,
    });

    toast.success("Measurement saved!", { description: "Entry added to your Health Diary" });
    resetForm();
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="scan" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Manual Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Manual Measurement Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Measurement State */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Measurement state</span>
              <span className="text-xs text-muted-foreground font-mono">{measurementState}</span>
            </Label>
            <Select
              value={measurementState}
              onValueChange={v => setMeasurementState(v as MeasurementState)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="flaccid">Flaccid</SelectItem>
                <SelectItem value="erect">Erect</SelectItem>
                <SelectItem value="paired">Paired (flaccid + erect)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional context */}
          <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-4">
            <div className="text-sm font-medium">Optional context</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={v => setMethod(v as MeasurementMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="bone-pressed">Bone-pressed</SelectItem>
                    <SelectItem value="non-bone-pressed">Non-bone-pressed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time of day</Label>
                <Select value={timeOfDay} onValueChange={v => setTimeOfDay(v as TimeOfDay)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperatureC">Temperature (°C, optional)</Label>
                <Input
                  id="temperatureC"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 22"
                  value={temperatureC}
                  onChange={e => setTemperatureC(e.target.value)}
                />
                {errors.temperatureC && (
                  <p className="text-xs text-destructive">{errors.temperatureC}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Checkbox checked={pumpRecent} onCheckedChange={v => setPumpRecent(Boolean(v))} />
                  Pumped recently (optional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  If this might affect temporary measurements, logging it helps interpret trends.
                </p>
              </div>
            </div>
          </div>

          {/* Length */}
          <div className="space-y-2">
            <Label htmlFor="length" className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" />
              Length (cm / in)
            </Label>
            <Input
              id="length"
              type="number"
              step="0.1"
              min="1"
              max="30"
              placeholder="e.g., 14.5"
              value={length}
              onChange={e => setLength(e.target.value)}
              className={errors.length ? "border-destructive" : ""}
            />
            {Number.isFinite(Number(length)) && (
              <p className="text-xs text-muted-foreground">
                {formatLength(Number(length), measurementUnits)}
              </p>
            )}
            {errors.length && <p className="text-xs text-destructive">{errors.length}</p>}
          </div>

          {/* Circumference */}
          <div className="space-y-2">
            <Label htmlFor="circumference" className="flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-primary" />
              Circumference (cm / in)
            </Label>
            <Input
              id="circumference"
              type="number"
              step="0.1"
              min="1"
              max="25"
              placeholder="e.g., 12.3"
              value={circumference}
              onChange={e => setCircumference(e.target.value)}
              className={errors.circumference ? "border-destructive" : ""}
            />
            {Number.isFinite(Number(circumference)) && (
              <p className="text-xs text-muted-foreground">
                {formatLength(Number(circumference), measurementUnits)}
              </p>
            )}
            {errors.circumference && (
              <p className="text-xs text-destructive">{errors.circumference}</p>
            )}
          </div>

          {/* Paired erect values */}
          {measurementState === "paired" && (
            <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-4">
              <div className="text-sm font-medium">Paired erect values</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="erectLength" className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-primary" />
                    Erect length (cm / in)
                  </Label>
                  <Input
                    id="erectLength"
                    type="number"
                    step="0.1"
                    min="1"
                    max="30"
                    placeholder="e.g., 15.8"
                    value={erectLength}
                    onChange={e => setErectLength(e.target.value)}
                    className={errors.erectLength ? "border-destructive" : ""}
                  />
                  {Number.isFinite(Number(erectLength)) && (
                    <p className="text-xs text-muted-foreground">
                      {formatLength(Number(erectLength), measurementUnits)}
                    </p>
                  )}
                  {errors.erectLength && (
                    <p className="text-xs text-destructive">{errors.erectLength}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="erectCircumference" className="flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-primary" />
                    Erect circumference (cm / in)
                  </Label>
                  <Input
                    id="erectCircumference"
                    type="number"
                    step="0.1"
                    min="1"
                    max="25"
                    placeholder="e.g., 13.2"
                    value={erectCircumference}
                    onChange={e => setErectCircumference(e.target.value)}
                    className={errors.erectCircumference ? "border-destructive" : ""}
                  />
                  {Number.isFinite(Number(erectCircumference)) && (
                    <p className="text-xs text-muted-foreground">
                      {formatLength(Number(erectCircumference), measurementUnits)}
                    </p>
                  )}
                  {errors.erectCircumference && (
                    <p className="text-xs text-destructive">{errors.erectCircumference}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Paired entries unlock the cleanest{" "}
                <span className="font-medium">Growers vs Showers</span> signal.
              </p>
            </div>
          )}

          {/* Curvature Angle */}
          <div className="space-y-2">
            <Label htmlFor="curvatureAngle" className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Curvature Angle (degrees)
            </Label>
            <Input
              id="curvatureAngle"
              type="number"
              step="1"
              min="0"
              max="90"
              placeholder="e.g., 15"
              value={curvatureAngle}
              onChange={e => setCurvatureAngle(e.target.value)}
              className={errors.curvatureAngle ? "border-destructive" : ""}
            />
            {errors.curvatureAngle && (
              <p className="text-xs text-destructive">{errors.curvatureAngle}</p>
            )}
          </div>

          {/* Curvature Direction */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Curvature Direction</Label>
            <Select value={curvatureDirection} onValueChange={setCurvatureDirection}>
              <SelectTrigger className={errors.curvatureDirection ? "border-destructive" : ""}>
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                {directions.map(dir => (
                  <SelectItem key={dir.value} value={dir.value}>
                    {dir.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.curvatureDirection && (
              <p className="text-xs text-destructive">{errors.curvatureDirection}</p>
            )}
          </div>

          {/* Pain Level */}
          <div className="space-y-3">
            <Label className="flex items-center justify-between">
              <span>Pain Level</span>
              <span className="text-sm font-mono text-primary">{painLevel[0]}/10</span>
            </Label>
            <Slider
              value={painLevel}
              onValueChange={setPainLevel}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>No pain</span>
              <span>Severe</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional observations..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{notes.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" variant="hero" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
