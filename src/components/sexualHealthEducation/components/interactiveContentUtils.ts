import type { InteractiveContent } from "@/lib/sexualHealthEducation";

export type AnswerValue = string | string[];

export type QuizLikeQuestion = {
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

export function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(x => String(x)) : [];
}

export function questionText(q: QuizLikeQuestion, index: number): string {
  const t = q.question_text ?? q.question ?? q.prompt;
  return typeof t === "string" && t.trim() ? t.trim() : `Question ${index + 1}`;
}

export function questionId(q: QuizLikeQuestion, index: number): string {
  const id = q.id;
  return typeof id === "string" && id.trim() ? id.trim() : `q_${index + 1}`;
}

export function normalizeCorrect(v: unknown): string | string[] | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(x => String(x));
  return null;
}

export function normalizeQuestions(raw: unknown): QuizLikeQuestion[] {
  if (Array.isArray(raw)) return raw as QuizLikeQuestion[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.questions)) return obj.questions as QuizLikeQuestion[];
    if (Array.isArray(obj.items)) return obj.items as QuizLikeQuestion[];
  }
  return [];
}

export function optionsForQuestion(q: QuizLikeQuestion): string[] {
  const opt = q.options;
  if (Array.isArray(opt)) return opt.map(x => String(x));
  if (opt && typeof opt === "object") {
    const o = opt as Record<string, unknown>;
    if (Array.isArray(o.options)) return asStringArray(o.options);
    if (Array.isArray(o.items)) return asStringArray(o.items);
  }
  return [];
}

export function isMultiSelect(q: QuizLikeQuestion): boolean {
  const t = String(q.question_type ?? q.type ?? "").toLowerCase();
  if (t.includes("multi")) return true;
  const correct = normalizeCorrect(q.correct_answer);
  return Array.isArray(correct);
}

export function isFreeText(q: QuizLikeQuestion): boolean {
  const t = String(q.question_type ?? q.type ?? "").toLowerCase();
  if (t.includes("text") || t.includes("free")) return true;
  const opts = optionsForQuestion(q);
  return opts.length === 0;
}

function safeSetEq(a: string[], b: string[]): boolean {
  const sa = new Set(a.map(String));
  const sb = new Set(b.map(String));
  if (sa.size !== sb.size) return false;
  for (const v of sa) if (!sb.has(v)) return false;
  return true;
}

export function scoreAttempt(params: {
  questions: QuizLikeQuestion[];
  answers: Record<string, AnswerValue>;
  answerKey: unknown;
}): { totalPoints: number; earnedPoints: number; percent: number | null } {
  const key =
    params.answerKey && typeof params.answerKey === "object"
      ? (params.answerKey as Record<string, unknown>)
      : {};

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
    const points =
      typeof pointsRaw === "number" && Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : 1;

    total += points;

    const userAnswer = params.answers[qid];
    if (typeof correct === "string") {
      if (typeof userAnswer === "string" && userAnswer === correct) earned += points;
      continue;
    }

    const userArr =
      typeof userAnswer === "string" ? [userAnswer] : Array.isArray(userAnswer) ? userAnswer : [];
    if (safeSetEq(userArr, correct)) earned += points;
  }

  if (total <= 0) return { totalPoints: 0, earnedPoints: 0, percent: null };
  return { totalPoints: total, earnedPoints: earned, percent: (earned / total) * 100 };
}

export function readPassingScore(content: InteractiveContent): number {
  const n = Number(content.passing_score ?? 70);
  if (!Number.isFinite(n)) return 70;
  return Math.max(0, Math.min(100, n));
}

export function percentToUi(p: number | null): number {
  if (p == null) return 0;
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

export function safeIsoNow(): string {
  return new Date().toISOString();
}

export function safeIsoDateNow(): string {
  return new Date().toISOString().slice(0, 10);
}
