import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookOpenCheck } from "lucide-react";

import {
  getUserProgress,
  updateUserProgress,
  type InteractiveContent,
} from "@/lib/sexualHealthEducation";

import {
  isFreeText,
  isMultiSelect,
  normalizeQuestions,
  optionsForQuestion,
  percentToUi,
  questionId,
  questionText,
  readPassingScore,
  safeIsoDateNow,
  safeIsoNow,
  scoreAttempt,
  type AnswerValue,
  type QuizLikeQuestion,
} from "./interactiveContentUtils";

export function InteractiveExerciseCard({
  moduleId,
  item,
}: {
  moduleId: string;
  item: InteractiveContent;
}): JSX.Element {
  const passingScore = readPassingScore(item);
  const questions = useMemo(() => normalizeQuestions(item.questions), [item.questions]);

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ percent: number | null; passed: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  const submit = async () => {
    setSubmitted(true);

    const { percent } = scoreAttempt({ questions, answers, answerKey: item.answers });
    const pct = percent == null ? null : Math.max(0, Math.min(100, percent));
    const passed = pct == null ? true : pct >= passingScore;
    setResult({ percent: pct, passed });

    // Persist best-effort: update user progress row.
    setSaving(true);
    try {
      const existing = await getUserProgress(moduleId);
      const current = existing?.[0] ?? null;
      const attempts = Number((current as any)?.quiz_attempts ?? 0) + 1;

      await updateUserProgress(moduleId, {
        quiz_attempts: attempts,
        quiz_score: pct == null ? null : pct,
        quiz_completed_at: safeIsoNow(),
        progress_percentage: passed
          ? 100
          : Math.max(Number((current as any)?.progress_percentage ?? 0), 25),
        is_completed: passed ? true : Boolean((current as any)?.is_completed ?? false),
        completed_at: passed ? safeIsoNow() : ((current as any)?.completed_at ?? null),
        last_accessed_at: safeIsoNow(),
      });

      toast.success(passed ? "Progress updated" : "Attempt saved");
    } catch {
      // User may not be signed in; lib already toasts on auth errors.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="glass" className="border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{item.title}</CardTitle>
            {item.description ? (
              <CardDescription className="mt-1">{item.description}</CardDescription>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{item.content_type}</Badge>
              {item.content_type === "quiz" || item.content_type === "assessment" ? (
                <Badge variant="outline">Pass: {passingScore}%</Badge>
              ) : null}
              <Badge variant="outline">{questions.length} questions</Badge>
              {submitted && result?.percent != null ? (
                <Badge variant={result.passed ? "default" : "destructive"}>
                  {result.percent.toFixed(0)}% {result.passed ? "passed" : "not passed"}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              Reset
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={saving || questions.length === 0}
              variant="gradient"
            >
              <BookOpenCheck className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : "Submit"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {submitted && result?.percent != null ? (
          <div className="space-y-2">
            <Progress value={percentToUi(result.percent)} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {safeIsoDateNow()} • {result.passed ? "Completed" : "Attempt recorded"}
            </div>
          </div>
        ) : null}

        {questions.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            This exercise has no questions configured yet.
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <InteractiveQuestionCard
                key={questionId(q, idx)}
                q={q}
                idx={idx}
                value={answers}
                onChange={setAnswers}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InteractiveQuestionCard({
  q,
  idx,
  value,
  onChange,
}: {
  q: QuizLikeQuestion;
  idx: number;
  value: Record<string, AnswerValue>;
  onChange: Dispatch<SetStateAction<Record<string, AnswerValue>>>;
}): JSX.Element {
  const qid = questionId(q, idx);
  const opts = optionsForQuestion(q);
  const multi = isMultiSelect(q);
  const freeText = isFreeText(q);
  const val = value[qid];
  const checked = Array.isArray(val) ? val : typeof val === "string" ? [val] : [];

  return (
    <Card key={qid} className="border-border/50">
      <CardHeader className="py-4">
        <CardTitle className="text-sm">{questionText(q, idx)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {freeText ? (
          <Textarea
            rows={3}
            value={typeof val === "string" ? val : ""}
            onChange={e => onChange(prev => ({ ...prev, [qid]: e.target.value }))}
            placeholder="Write your answer…"
          />
        ) : multi ? (
          <div className="space-y-2">
            {opts.map(opt => {
              const isChecked = checked.includes(opt);
              return (
                <label
                  key={`${qid}-${opt}`}
                  className="flex items-center gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-secondary/40"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => {
                      onChange(prev => {
                        const prevVal = prev[qid];
                        const arr = Array.isArray(prevVal)
                          ? [...prevVal]
                          : typeof prevVal === "string"
                            ? [prevVal]
                            : [];
                        const next = arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt];
                        return { ...prev, [qid]: next };
                      });
                    }}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {opts.map(opt => {
              const isSelected = typeof val === "string" && val === opt;
              return (
                <label
                  key={`${qid}-${opt}`}
                  className="flex items-center gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-secondary/40"
                >
                  <input
                    type="radio"
                    name={qid}
                    value={opt}
                    checked={isSelected}
                    onChange={() => onChange(prev => ({ ...prev, [qid]: opt }))}
                    aria-label={opt}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
