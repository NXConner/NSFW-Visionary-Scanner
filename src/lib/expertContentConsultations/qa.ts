import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { ExpertQA } from "@/lib/expertContentConsultations/types";
import { requireUserId } from "@/lib/expertContentConsultations/utils";

function mapQa(row: any): ExpertQA {
  return {
    id: String(row.id),
    expert_id: String(row.expert_id),
    user_id: String(row.user_id ?? ""),
    question: String(row.question_text ?? ""),
    answer: row.answer_text ?? null,
    category: row.question_category ?? null,
    status: row.is_answered ? "answered" : "pending",
    answered_at: row.answered_at ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function askExpertQuestion(
  expertId: string,
  question: string,
  category?: string,
  anonymous: boolean = false,
): Promise<ExpertQA | null> {
  try {
    const userId = await requireUserId();
    const q = String(question || "").trim();
    if (!q) return null;

    const { data, error } = await fromExtended("expert_qa")
      .insert({
        expert_id: expertId,
        user_id: userId,
        question_text: q,
        question_category: category ?? null,
        is_anonymous: Boolean(anonymous),
        is_public: true,
        is_answered: false,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("askExpertQuestion failed", { error: error.message });
      toast.error("Failed to submit question");
      return null;
    }

    toast.success("Question submitted");
    return mapQa(data);
  } catch (error) {
    logger.error("askExpertQuestion error", { error });
    toast.error("Failed to submit question");
    return null;
  }
}

export async function getExpertQA(expertId: string): Promise<ExpertQA[]> {
  try {
    const { data, error } = await fromExtended("expert_qa")
      .select("*")
      .eq("expert_id", expertId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      logger.error("getExpertQA failed", { error: error.message });
      return [];
    }

    return (data || []).map(mapQa);
  } catch (error) {
    logger.error("getExpertQA error", { error });
    return [];
  }
}
