/**
 * Prostate & Testicular Health Focus (Supabase-backed)
 *
 * Backed by migration:
 * - supabase/migrations/20251207000006_prostate_testicular_education.sql
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { fromExtended } from "@/lib/supabaseExtensions";

const db = { from: (t: string) => fromExtended(t as any) };

export interface EducationContent {
  id: string;
  title: string;
  content_type: "article" | "video" | "guide" | "assessment" | "tutorial" | "faq";
  category: "prostate" | "testicular" | "sexual" | "urinary" | "general" | "prevention";
  content: string;
  summary: string | null;
  video_url: string | null;
  image_url: string | null;
  difficulty_level: "beginner" | "intermediate" | "advanced" | null;
  reading_time_minutes: number | null;
  tags: string[];
  is_premium: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface HealthAssessment {
  id: string;
  title: string;
  category: "prostate" | "testicular" | "sexual" | "urinary" | "general";
  description: string | null;
  questions: Array<{
    id: string;
    question: string;
    type: "multiple_choice" | "scale" | "yes_no" | "text";
    options?: string[];
    required: boolean;
  }>;
  scoring_logic: Record<string, any>;
  risk_levels: Record<string, any>;
  recommendations: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  assessment_id: string;
  answers: Record<string, any>;
  score: number | null;
  risk_level: "low" | "moderate" | "high" | "very_high" | null;
  recommendations: string[];
  completed_at: string;
  created_at: string;
}

export interface SelfExamGuide {
  id: string;
  title: string;
  exam_type: "testicular" | "prostate" | "general";
  step_by_step_instructions: string[];
  video_url: string | null;
  image_urls: string[];
  frequency_recommendation: string | null;
  warning_signs: string[];
  when_to_see_doctor: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScreeningReminder {
  id: string;
  user_id: string;
  reminder_type: "psa_test" | "testicular_exam" | "general_checkup" | "specialist_visit";
  frequency_months: number | null;
  last_reminder_date: string | null;
  next_reminder_date: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function computeScore(
  assessment: Pick<HealthAssessment, "questions" | "scoring_logic">,
  answers: Record<string, any>,
): number | null {
  try {
    const logic = assessment.scoring_logic ?? {};
    let total = 0;
    let used = 0;

    for (const q of assessment.questions || []) {
      const ans = answers[q.id];
      if (ans == null || ans === "") continue;

      // If scoring_logic provides per-question weights/maps, use it; otherwise basic scoring.
      const qLogic = (logic as any)[q.id];
      if (qLogic && typeof qLogic === "object") {
        if (typeof qLogic.weight === "number") {
          total += safeNum(qLogic.weight, 1);
          used += 1;
          continue;
        }
        if (q.type === "multiple_choice" && qLogic.options && typeof qLogic.options === "object") {
          total += safeNum(qLogic.options[String(ans)], 0);
          used += 1;
          continue;
        }
        if (q.type === "yes_no" && qLogic.yes != null) {
          total +=
            String(ans).toLowerCase() === "yes" ? safeNum(qLogic.yes, 1) : safeNum(qLogic.no, 0);
          used += 1;
          continue;
        }
        if (q.type === "scale" && qLogic.scale && typeof qLogic.scale === "object") {
          total += safeNum(qLogic.scale[String(ans)], safeNum(ans, 0));
          used += 1;
          continue;
        }
      }

      // Fallback scoring:
      if (q.type === "yes_no") {
        total += String(ans).toLowerCase() === "yes" ? 1 : 0;
        used += 1;
      } else if (q.type === "scale") {
        total += safeNum(ans, 0);
        used += 1;
      } else {
        // multiple_choice/text: count as 1 answered
        total += 1;
        used += 1;
      }
    }

    if (used === 0) return null;
    return Math.round(total);
  } catch {
    return null;
  }
}

function computeRiskLevel(
  assessment: Pick<HealthAssessment, "risk_levels">,
  score: number | null,
): AssessmentResult["risk_level"] {
  if (score == null) return null;
  const rl = assessment.risk_levels ?? {};
  // risk_levels can be { low: { max: 5 }, moderate: { max: 10 }, ... } or thresholds array.
  const thresholds = (rl as any).thresholds;
  if (Array.isArray(thresholds)) {
    // [{ level: 'low', max: 5 }, ...]
    for (const t of thresholds) {
      if (t && typeof t === "object" && typeof t.max === "number" && score <= t.max) {
        return (String(t.level) as any) ?? null;
      }
    }
    return (String((thresholds[thresholds.length - 1] as any)?.level) as any) ?? null;
  }

  const order: Array<AssessmentResult["risk_level"]> = ["low", "moderate", "high", "very_high"];
  for (const level of order) {
    const cfg = (rl as any)[level];
    if (cfg && typeof cfg === "object" && typeof cfg.max === "number" && score <= cfg.max)
      return level;
  }
  return null;
}

function computeRecommendations(
  assessment: Pick<HealthAssessment, "recommendations">,
  risk: AssessmentResult["risk_level"],
): string[] {
  const rec = assessment.recommendations ?? {};
  if (!risk) return [];
  const v = (rec as any)[risk];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return [v];
  return [];
}

export async function getEducationContent(
  category: "prostate" | "testicular" | "sexual" | "urinary" | "general" | "prevention",
  limit: number = 20,
): Promise<EducationContent[]> {
  try {
    const { data, error } = await db
      .from("health_education_content")
      .select("*")
      .eq("category", category)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .range(0, Math.max(0, limit - 1));
    if (error) {
      logger.error("getEducationContent failed", { error: error.message });
      return [];
    }
    return (data || []) as EducationContent[];
  } catch (error) {
    logger.error("getEducationContent error", { error });
    return [];
  }
}

export async function getFeaturedEducationContent(limit: number = 10): Promise<EducationContent[]> {
  try {
    const { data, error } = await db
      .from("health_education_content")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .range(0, Math.max(0, limit - 1));
    if (error) {
      logger.error("getFeaturedEducationContent failed", { error: error.message });
      return [];
    }
    return (data || []) as EducationContent[];
  } catch (error) {
    logger.error("getFeaturedEducationContent error", { error });
    return [];
  }
}

export async function getHealthAssessments(
  category?: "prostate" | "testicular" | "sexual" | "urinary" | "general",
): Promise<HealthAssessment[]> {
  try {
    let q = db
      .from("health_assessments")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) {
      logger.error("getHealthAssessments failed", { error: error.message });
      return [];
    }
    return (data || []) as HealthAssessment[];
  } catch (error) {
    logger.error("getHealthAssessments error", { error });
    return [];
  }
}

export async function submitAssessmentResults(
  assessmentId: string,
  answers: Record<string, any>,
): Promise<AssessmentResult | null> {
  try {
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth.user) {
      toast.error("Please sign in");
      return null;
    }

    const { data: assessment, error: aErr } = await db
      .from("health_assessments")
      .select("*")
      .eq("id", assessmentId)
      .eq("is_active", true)
      .maybeSingle();
    if (aErr || !assessment) {
      toast.error("Assessment not found");
      return null;
    }

    const score = computeScore(assessment as HealthAssessment, answers);
    const risk = computeRiskLevel(assessment as HealthAssessment, score);
    const recs = computeRecommendations(assessment as HealthAssessment, risk);

    const { data, error } = await db
      .from("user_assessment_results")
      .insert({
        user_id: auth.user.id,
        assessment_id: assessmentId,
        answers,
        score,
        risk_level: risk,
        recommendations: recs,
        completed_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      logger.error("submitAssessmentResults failed", { error: error.message });
      toast.error("Failed to save results");
      return null;
    }

    toast.success("Assessment completed!");
    return data as AssessmentResult;
  } catch (error) {
    logger.error("submitAssessmentResults error", { error });
    toast.error("Failed to submit assessment");
    return null;
  }
}

export async function getSelfExamGuides(
  examType: "testicular" | "prostate" | "general",
): Promise<SelfExamGuide[]> {
  try {
    const { data, error } = await db
      .from("self_examination_guides")
      .select("*")
      .eq("exam_type", examType)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      logger.error("getSelfExamGuides failed", { error: error.message });
      return [];
    }
    return (data || []) as SelfExamGuide[];
  } catch (error) {
    logger.error("getSelfExamGuides error", { error });
    return [];
  }
}

export async function getScreeningReminders(): Promise<ScreeningReminder[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await db
      .from("screening_reminders")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("next_reminder_date", { ascending: true })
      .limit(200);

    if (error) {
      logger.error("getScreeningReminders failed", { error: error.message });
      return [];
    }

    return (data || []).map((r: any) => ({
      ...r,
      next_reminder_date: String(r.next_reminder_date),
      last_reminder_date: r.last_reminder_date ? String(r.last_reminder_date) : null,
    })) as ScreeningReminder[];
  } catch (error) {
    logger.error("getScreeningReminders error", { error });
    return [];
  }
}

export async function createScreeningReminder(
  reminderType: ScreeningReminder["reminder_type"],
  frequencyMonths: number,
  nextReminderDate: string,
): Promise<boolean> {
  try {
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth.user) {
      toast.error("Please sign in");
      return false;
    }

    const { error } = await db.from("screening_reminders").insert({
      user_id: auth.user.id,
      reminder_type: reminderType,
      frequency_months: frequencyMonths,
      last_reminder_date: null,
      next_reminder_date: nextReminderDate,
      is_active: true,
      notes: null,
    });

    if (error) {
      logger.error("createScreeningReminder failed", { error: error.message });
      toast.error("Failed to create reminder");
      return false;
    }

    toast.success("Screening reminder created");
    return true;
  } catch (error) {
    logger.error("createScreeningReminder error", { error });
    toast.error("Failed to create reminder");
    return false;
  }
}

export async function updateScreeningReminder(
  reminderId: string,
  updates: Partial<ScreeningReminder>,
): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return false;

    const allowed: Record<string, any> = {};
    if (updates.frequency_months != null) allowed.frequency_months = updates.frequency_months;
    if (updates.last_reminder_date != null) allowed.last_reminder_date = updates.last_reminder_date;
    if (updates.next_reminder_date != null) allowed.next_reminder_date = updates.next_reminder_date;
    if (updates.is_active != null) allowed.is_active = updates.is_active;
    if (updates.notes != null) allowed.notes = updates.notes;

    const { error } = await db
      .from("screening_reminders")
      .update(allowed)
      .eq("id", reminderId)
      .eq("user_id", auth.user.id);

    if (error) {
      logger.error("updateScreeningReminder failed", { error: error.message });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("updateScreeningReminder error", { error });
    return false;
  }
}

export async function getUserAssessmentResults(): Promise<AssessmentResult[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await db
      .from("user_assessment_results")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("completed_at", { ascending: false })
      .limit(200);

    if (error) {
      logger.error("getUserAssessmentResults failed", { error: error.message });
      return [];
    }
    return (data || []) as AssessmentResult[];
  } catch (error) {
    logger.error("getUserAssessmentResults error", { error });
    return [];
  }
}
