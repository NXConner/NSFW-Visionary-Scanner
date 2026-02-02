import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { ConsultationBooking } from "@/lib/expertContentConsultations/types";
import { parseDateTimeLocalToIso, requireUserId } from "@/lib/expertContentConsultations/utils";

function mapBooking(row: any): ConsultationBooking {
  return {
    id: String(row.id),
    expert_id: String(row.expert_id),
    user_id: String(row.user_id),
    consultation_type: String(row.consultation_type ?? ""),
    scheduled_at: String(row.scheduled_at ?? row.scheduled_at ?? new Date().toISOString()),
    duration_minutes: Number(row.duration_minutes ?? 60),
    status: String(row.booking_status ?? "pending"),
    payment_status: String(row.payment_status ?? "pending"),
    payment_amount: row.amount != null ? Number(row.amount) : null,
    notes: row.session_notes ?? null,
    meeting_url: row.session_url ?? null,
    rating: null,
    review: null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function bookConsultation(
  expertId: string,
  bookingData: {
    consultationType: string;
    scheduledAt: string;
    durationMinutes?: number;
    topic?: string;
  },
): Promise<ConsultationBooking | null> {
  try {
    const userId = await requireUserId();
    const duration = Math.max(15, Math.min(240, Number(bookingData.durationMinutes ?? 60)));
    const scheduledAtIso = parseDateTimeLocalToIso(bookingData.scheduledAt);

    // Load expert rate

    const { data: expertRow, error: expertErr } = await fromExtended("expert_profiles")
      .select("id, consultation_rate_per_hour, currency")
      .eq("id", expertId)
      .maybeSingle();
    if (expertErr || !expertRow) {
      toast.error("Expert not found");
      return null;
    }

    const ratePerHour = Number(expertRow.consultation_rate_per_hour ?? 0);
    const amount = Math.max(0, Number(((ratePerHour / 60) * duration).toFixed(2)));

    const { data, error } = await fromExtended("consultation_bookings")
      .insert({
        expert_id: expertId,
        user_id: userId,
        booking_type: "individual",
        consultation_type: String(bookingData.consultationType || "live_video"),
        scheduled_at: scheduledAtIso,
        duration_minutes: duration,
        topic: bookingData.topic ?? null,
        amount,
        currency: String(expertRow.currency ?? "USD"),
        payment_status: amount > 0 ? "pending" : "paid",
        booking_status: amount > 0 ? "pending" : "confirmed",
      })
      .select("*")
      .single();

    if (error) {
      logger.error("bookConsultation failed", { error: error.message });
      toast.error("Failed to book consultation");
      return null;
    }

    return mapBooking(data);
  } catch (error) {
    logger.error("bookConsultation error", { error });
    toast.error("Failed to book consultation");
    return null;
  }
}

export async function getMyConsultations(): Promise<ConsultationBooking[]> {
  try {
    const userId = await requireUserId();

    const { data, error } = await fromExtended("consultation_bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("getMyConsultations failed", { error: error.message });
      return [];
    }

    return (data || []).map(mapBooking);
  } catch (error) {
    logger.error("getMyConsultations error", { error });
    return [];
  }
}
