import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { ExpertConsultation } from "./types";

function defaultConsultationPrice(
  type: ExpertConsultation["consultation_type"],
  durationMinutes: number,
): number {
  const base = type === "one_time" ? 99.99 : type === "follow_up" ? 49.99 : 29.99;
  const hourFactor = Math.max(1, durationMinutes / 60);
  return Math.round(base * hourFactor * 100) / 100;
}

export async function bookExpertConsultation(
  expertId: string,
  scheduledAt: string,
  consultationType: ExpertConsultation["consultation_type"],
  userConcerns?: string,
  durationMinutes: number = 30,
): Promise<ExpertConsultation | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to book a consultation");
      return null;
    }

    const price = defaultConsultationPrice(consultationType, durationMinutes);
    const paymentStatus = price > 0 ? "pending" : "paid";

    const { data, error } = await supabase
      .from("expert_consultations")
      .insert({
        expert_id: expertId,
        user_id: user.id,
        consultation_type: consultationType,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        status: "pending",
        payment_amount: price,
        payment_status: paymentStatus,
        notes: userConcerns || null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error booking consultation", { error: error.message });
      toast.error("Failed to book consultation");
      return null;
    }

    toast.success("Consultation booked! Awaiting confirmation.");
    return data as unknown as ExpertConsultation;
  } catch (err) {
    logger.error("Error booking consultation", { error: err });
    toast.error("Failed to book consultation");
    return null;
  }
}

export async function getUserConsultations(): Promise<ExpertConsultation[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("expert_consultations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to get user consultations", { error: error.message });
      return [];
    }
    return (data || []) as unknown as ExpertConsultation[];
  } catch (err) {
    logger.error("Error getting consultations", { error: err });
    return [];
  }
}

export async function rateConsultation(
  consultationId: string,
  rating: number,
  feedback?: string,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("expert_consultations")
      .update({
        rating: rating,
        review: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultationId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error rating consultation", { error: error.message });
      toast.error("Failed to save rating");
      return false;
    }
    toast.success("Rating saved");
    return true;
  } catch (err) {
    logger.error("Error rating consultation", { error: err });
    return false;
  }
}
