/**
 * Expert Content (compat wrapper)
 *
 * The repo’s active implementation lives under `src/lib/expertContentConsultations/*`.
 * This file keeps the older import path (`@/lib/expertContent`) working while
 * avoiding duplicate, schema-drifting logic.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type {
  ExpertArticle,
  ExpertProfile,
  ConsultationBooking,
} from "@/lib/expertContentConsultations/types";
import { getExpertProfiles as getExpertProfilesImpl } from "@/lib/expertContentConsultations/profiles";
import { getExpertArticles as getExpertArticlesImpl } from "@/lib/expertContentConsultations/articles";
import { bookConsultation as bookConsultationImpl } from "@/lib/expertContentConsultations/consultations";
import { askExpertQuestion } from "@/lib/expertContentConsultations/qa";
import { rateExpert as rateExpertImpl } from "@/lib/expertContentConsultations/ratings";

export type { ExpertProfile, ExpertArticle };

// Historical alias used by older components/utils.
export type ExpertConsultation = ConsultationBooking;

export async function getExpertProfiles(
  specialty?: string,
  minRating?: number,
): Promise<ExpertProfile[]> {
  const profiles = await getExpertProfilesImpl(undefined, specialty);
  if (!minRating) return profiles;
  return profiles.filter(p => Number(p.rating ?? 0) >= Number(minRating));
}

export async function getExpertArticles(
  expertId?: string,
  category?: string,
): Promise<ExpertArticle[]> {
  return getExpertArticlesImpl(expertId, category);
}

export async function bookConsultation(
  expertId: string,
  consultationType: "individual" | "group",
  scheduledAt: string,
  durationMinutes: number,
): Promise<ExpertConsultation | null> {
  // Map the legacy "individual/group" concept to the newer consultation booking type.
  // The newer module treats these as product-level types, not video modality.
  const mappedType = consultationType === "group" ? "group" : "individual";
  return bookConsultationImpl(expertId, {
    consultationType: mappedType,
    scheduledAt,
    durationMinutes,
    topic: "Consultation",
  }) as Promise<ExpertConsultation | null>;
}

export async function submitExpertQuestion(
  expertId: string,
  question: string,
  category?: string,
): Promise<boolean> {
  const res = await askExpertQuestion(expertId, question, category);
  return Boolean(res);
}

export async function rateExpert(
  consultationId: string,
  rating: number,
  review?: string,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return false;
    }

    const { data, error } = await supabase
      .from("consultation_bookings")
      .select("expert_id")
      .eq("id", consultationId)
      .maybeSingle();
    if (error || !data?.expert_id) {
      toast.error("Consultation not found");
      return false;
    }

    const res = await rateExpertImpl(
      String(data.expert_id),
      { overallRating: rating, reviewText: review },
      consultationId,
    );
    return Boolean(res);
  } catch (error) {
    logger.error("rateExpert error", { error });
    return false;
  }
}
