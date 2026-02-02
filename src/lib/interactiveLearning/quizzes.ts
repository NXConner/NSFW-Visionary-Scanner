import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { LearningQuiz, LearningQuizAttempt, QuizQuestion } from "./types";
import { completeLesson } from "./progress";

type LearningQuizRow = Omit<LearningQuiz, "questions"> & { questions: unknown };

function normalizeQuestions(raw: unknown): QuizQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(q => q as Partial<QuizQuestion>)
    .filter(q => Boolean(q.id && q.question_text && q.question_type))
    .map(q => ({
      id: String(q.id),
      question_text: String(q.question_text),
      question_type: String(q.question_type),
      options: Array.isArray(q.options) ? q.options.map(o => String(o)) : undefined,
      correct_answer: (q.correct_answer ?? "") as QuizQuestion["correct_answer"],
      explanation: q.explanation ? String(q.explanation) : undefined,
      points: q.points != null ? Number(q.points) : undefined,
    }));
}

function mapQuiz(row: LearningQuizRow): LearningQuiz {
  return { ...row, questions: normalizeQuestions(row.questions) } as LearningQuiz;
}

export async function getLessonQuiz(lessonId: string): Promise<LearningQuiz | null> {
  try {
    const { data, error } = await supabase
      .from("learning_quizzes")
      .select("*")
      .eq("lesson_id", lessonId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapQuiz(data as LearningQuizRow) : null;
  } catch (error) {
    logger.error("Failed to fetch lesson quiz", { error });
    return null;
  }
}

export async function getCourseQuiz(courseId: string): Promise<LearningQuiz | null> {
  try {
    const { data, error } = await supabase
      .from("learning_quizzes")
      .select("*")
      .eq("course_id", courseId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapQuiz(data as LearningQuizRow) : null;
  } catch (error) {
    logger.error("Failed to fetch course quiz", { error });
    return null;
  }
}

function isAnswerCorrect(answer: string | string[], correct: string | string[]): boolean {
  if (Array.isArray(correct)) {
    const a = Array.isArray(answer) ? answer : [answer];
    const norm = (x: string) => x.trim().toLowerCase();
    const setA = new Set(a.map(norm));
    const setC = new Set(correct.map(norm));
    if (setA.size !== setC.size) return false;
    for (const c of setC) if (!setA.has(c)) return false;
    return true;
  }
  const a = Array.isArray(answer) ? answer.join(",") : answer;
  return a.trim().toLowerCase() === String(correct).trim().toLowerCase();
}

function scoreAttempt(
  quiz: LearningQuiz,
  answers: Record<string, string | string[]>,
): { score: number; percentage: number; passed: boolean } {
  const questions = quiz.questions || [];
  const totalPoints = questions.reduce((sum, q) => sum + Number(q.points || 1), 0) || 1;
  const earned = questions.reduce((sum, q) => {
    const pts = Number(q.points || 1);
    const ans = answers[q.id];
    if (ans == null) return sum;
    return sum + (isAnswerCorrect(ans, q.correct_answer) ? pts : 0);
  }, 0);

  const percentage = Math.round((earned / totalPoints) * 100);
  const passing = Number(quiz.passing_score || 70);
  return { score: earned, percentage, passed: percentage >= passing };
}

export async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, string | string[]>,
  timeTakenSeconds?: number,
): Promise<LearningQuizAttempt | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return null;
    }

    const { data: quizRow, error: quizErr } = await supabase
      .from("learning_quizzes")
      .select("*")
      .eq("id", quizId)
      .single();
    if (quizErr) throw quizErr;
    const quiz = mapQuiz(quizRow as LearningQuizRow);

    if (quiz.attempt_limit != null) {
      const { count } = await supabase
        .from("learning_quiz_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("quiz_id", quizId);
      if ((count || 0) >= Number(quiz.attempt_limit)) {
        toast.error("Attempt limit reached");
        return null;
      }
    }

    const result = scoreAttempt(quiz, answers);

    const { data, error } = await supabase
      .from("learning_quiz_attempts")
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        answers,
        score: result.score,
        percentage_score: result.percentage,
        passed: result.passed,
        time_taken_seconds: timeTakenSeconds ?? null,
        completed_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    if (quiz.lesson_id && result.passed) {
      await completeLesson(quiz.lesson_id);
    }

    toast.success(result.passed ? "Quiz passed!" : "Quiz submitted");
    return data as LearningQuizAttempt;
  } catch (error) {
    logger.error("Failed to submit quiz attempt", { error });
    toast.error("Failed to submit quiz");
    return null;
  }
}

export async function getQuizAttempts(quizId: string): Promise<LearningQuizAttempt[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("learning_quiz_attempts")
      .select("*")
      .eq("user_id", user.id)
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []) as LearningQuizAttempt[];
  } catch (error) {
    logger.error("Failed to fetch quiz attempts", { error });
    return [];
  }
}
