import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { submitAssessmentResults, type HealthAssessment } from "@/lib/prostateTesticularHealth";

export function AssessmentDialog({
  open,
  onOpenChange,
  assessment,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: HealthAssessment | null;
  onSubmitted: () => Promise<void>;
}): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const questions = useMemo(() => assessment?.questions ?? [], [assessment?.questions]);

  const setAnswer = useCallback((id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const canSubmit = useMemo(() => {
    if (!assessment) return false;
    return questions.every(q => {
      if (!q.required) return true;
      const v = answers[q.id];
      return v != null && String(v).trim() !== "";
    });
  }, [answers, assessment, questions]);

  const handleSubmit = useCallback(async () => {
    if (!assessment) return;
    if (!canSubmit) {
      toast.error("Please answer all required questions");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitAssessmentResults(assessment.id, answers);
      if (res) {
        await onSubmitted();
        onOpenChange(false);
        setAnswers({});
      }
    } finally {
      setSubmitting(false);
    }
  }, [answers, assessment, canSubmit, onOpenChange, onSubmitted]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{assessment ? assessment.title : "Assessment"}</DialogTitle>
        </DialogHeader>

        {!assessment ? (
          <div className="text-muted-foreground">No assessment selected</div>
        ) : (
          <div className="space-y-4">
            {assessment.description && (
              <div className="text-sm text-muted-foreground">{assessment.description}</div>
            )}

            <div className="space-y-3">
              {questions.map(q => (
                <Card key={q.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <Label className="font-medium">
                        {q.question}{" "}
                        {q.required ? <span className="text-destructive">*</span> : null}
                      </Label>
                    </div>

                    {q.type === "multiple_choice" ? (
                      <Select
                        value={answers[q.id] != null ? String(answers[q.id]) : ""}
                        onValueChange={v => setAnswer(q.id, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {(q.options || []).map(opt => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : q.type === "yes_no" ? (
                      <Select
                        value={answers[q.id] != null ? String(answers[q.id]) : ""}
                        onValueChange={v => setAnswer(q.id, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : q.type === "scale" ? (
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={answers[q.id] != null ? String(answers[q.id]) : ""}
                        onChange={e => setAnswer(q.id, e.target.value)}
                        placeholder="Enter a number"
                      />
                    ) : (
                      <Textarea
                        value={answers[q.id] != null ? String(answers[q.id]) : ""}
                        onChange={e => setAnswer(q.id, e.target.value)}
                        placeholder="Your answer"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!assessment || !canSubmit || submitting}
            variant="gradient"
          >
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
