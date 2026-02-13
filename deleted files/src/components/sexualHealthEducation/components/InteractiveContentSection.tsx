import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookOpenCheck, RotateCcw } from "lucide-react";

import {
  getInteractiveContent,
  getUserProgress,
  updateUserProgress,
  type InteractiveContent,
} from "@/lib/sexualHealthEducation";

type AnswerValue = string | string[];

type QuizLikeQuestion = {
  id?: string;
  question_text?: string;
  question?: string;
  prompt?: string;
  question_type?: string;
  type?: string;
  options?: unknown;
  correct_answer?: unknown;
  explanation?: unknown;
  points?: unknown;
};

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(x => String(x)) : [];
}

function questionText(q: QuizLikeQuestion, index: number): string {
  const t = q.question_text ?? q.question ?? q.prompt;
  return typeof t === "string" && t.trim() ? t.trim() : `Question ${index + 1}`;
}

function questionId(q: QuizLikeQuestion, index: number): string {
  const id = q.id;
  return typeof id === "string" && id.trim() ? id.trim() : `q_${index + 1}`;
}

function normalizeCorrect(v: unknown): string | string[] | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(x => String(x));
  return null;
}

function normalizeQuestions(raw: unknown): QuizLikeQuestion[] {
  if (Array.isArray(raw)) return raw as QuizLikeQuestion[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.questions)) return obj.questions as QuizLikeQuestion[];
    if (Array.isArray(obj.items)) return obj.items as QuizLikeQuestion[];
  }
  return [];
}

function safeSetEq(a: string[], b: string[]): boolean {
  const sa = new Set(a.map(String));
  const sb = new Set(b.map(String));
  if (sa.size !== sb.size) return false;
  for (const v of sa) if (!sb.has(v)) return false;
  return true;
}

function scoreAttempt(params: {
  questions: QuizLikeQuestion[];
  answers: Record<string, AnswerValue>;
  answerKey: unknown;
}): { totalPoints: number; earnedPoints: number; percent: number | null } {
  const key = params.answerKey && typeof params.answerKey === "object" ? (params.answerKey as Record<string, unknown>) : {};

  let total = 0;
  let earned = 0;

  for (let i = 0; i < params.questions.length; i++) {
    const q = params.questions[i]!;
    const qid = questionId(q, i);

    const correctFromKey = normalizeCorrect(key[qid]);
    const correctFromQuestion = normalizeCorrect(q.correct_answer);
    const correct = correctFromKey ?? correctFromQuestion;
    if (correct == null) continue; // ungraded

    const pointsRaw = q.points;
    const points = typeof pointsRaw === "number" && Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 1;

    total += points;

    const userAnswer = params.answers[qid];
    if (typeof correct === "string") {
      if (typeof userAnswer === "string" && userAnswer === correct) earned += points;
      continue;
    }

    // multi-answer
    const userArr = typeof userAnswer === "string" ? [userAnswer] : Array.isArray(userAnswer) ? userAnswer : [];
    if (safeSetEq(userArr, correct)) earned += points;
  }

  if (total <= 0) return { totalPoints: 0, earnedPoints: 0, percent: null };
  return { totalPoints: total, earnedPoints: earned, percent: (earned / total) * 100 };
}

function readPassingScore(content: InteractiveContent): number {
  const n = Number(content.passing_score ?? 70);
  if (!Number.isFinite(n)) return 70;
  return Math.max(0, Math.min(100, n));
}

function optionsForQuestion(q: QuizLikeQuestion): string[] {
  const opt = q.options;
  if (Array.isArray(opt)) return opt.map(x => String(x));
  if (opt && typeof opt === "object") {
    const o = opt as Record<string, unknown>;
    if (Array.isArray(o.options)) return asStringArray(o.options);
    if (Array.isArray(o.items)) return asStringArray(o.items);
  }
  return [];
}

function isMultiSelect(q: QuizLikeQuestion): boolean {
  const t = String(q.question_type ?? q.type ?? "").toLowerCase();
  if (t.includes("multi")) return true;
  const correct = normalizeCorrect(q.correct_answer);
  return Array.isArray(correct);
}

function isFreeText(q: QuizLikeQuestion): boolean {
  const t = String(q.question_type ?? q.type ?? "").toLowerCase();
  if (t.includes("text") || t.includes("free")) return true;
  const opts = optionsForQuestion(q);
  return opts.length === 0;
}

function percentToUi(p: number | null): number {
  if (p == null) return 0;
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

function safeIsoNow(): string {
  return new Date().toISOString();
}

function safeIsoDateNow(): string {
  return new Date().toISOString().slice(0, 10);
}

export function InteractiveContentSection({
  moduleId,
  hasPrimaryContent,
  isAdmin,
}: {
  moduleId: string;
  hasPrimaryContent: boolean;
  isAdmin: boolean;
}): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InteractiveContent[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getInteractiveContent(moduleId);
      setItems(next);
    } catch {
      toast.error("Failed to load interactive content");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const showEmptyNotice = !loading && items.length === 0 && !hasPrimaryContent;
  if (loading && items.length === 0) {
    return (
      <Card variant="glass" className="border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">Loading interactive content…</CardContent>
      </Card>
    );
  }

  if (showEmptyNotice) {
    return (
      <Card variant="glass" className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">This module is not yet published</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Add article/video content or create an interactive exercise to publish this module."
              : "There is no content available for this module yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={load}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reload
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!loading && items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Interactive exercises</h3>
          <p className="text-sm text-muted-foreground">
            Quizzes and assessments are saved to your progress when you’re signed in.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {items.map(item => (
        <InteractiveExerciseCard key={item.id ?? item.title} moduleId={moduleId} item={item} />
      ))}
    </div>
  );
}

function InteractiveExerciseCard({
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
        progress_percentage: passed ? 100 : Math.max(Number((current as any)?.progress_percentage ?? 0), 25),
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
            {questions.map((q, idx) => {
              const qid = questionId(q, idx);
              const opts = optionsForQuestion(q);
              const multi = isMultiSelect(q);
              const freeText = isFreeText(q);
              const val = answers[qid];
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
                        onChange={e => setAnswers(prev => ({ ...prev, [qid]: e.target.value }))}
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
                                  setAnswers(prev => {
                                    const prevVal = prev[qid];
                                    const arr = Array.isArray(prevVal)
                                      ? [...prevVal]
                                      : typeof prevVal === "string"
                                        ? [prevVal]
                                        : [];
                                    const next = arr.includes(opt)
                                      ? arr.filter(x => x !== opt)
                                      : [...arr, opt];
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
                                onChange={() => setAnswers(prev => ({ ...prev, [qid]: opt }))}
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
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

