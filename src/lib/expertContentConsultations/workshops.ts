import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { GroupWorkshop } from "@/lib/expertContentConsultations/types";
import { requireUserId } from "@/lib/expertContentConsultations/utils";

function mapWorkshop(w: any): GroupWorkshop {
  return {
    id: String(w.id),
    expert_id: String(w.expert_id),
    title: String(w.workshop_title ?? w.title ?? ""),
    description: w.description ?? null,
    scheduled_at: String(w.scheduled_at ?? new Date().toISOString()),
    duration_minutes: Number(w.duration_minutes ?? 60),
    max_participants: w.max_participants ?? null,
    current_participants: Number(w.current_participants ?? 0),
    price_per_person: Number(w.price_per_person ?? 0),
    status: String(w.booking_status ?? "open"),
    meeting_url: w.session_url ?? null,
    recording_url: w.session_recording_url ?? null,
    created_at: String(w.created_at ?? new Date().toISOString()),
    updated_at: String(w.updated_at ?? new Date().toISOString()),
  };
}

export async function getGroupWorkshops(expertId?: string): Promise<GroupWorkshop[]> {
  try {
    let q = fromExtended("workshop_bookings")
      .select("*")
      .eq("booking_status", "open")
      .order("scheduled_at", { ascending: true })
      .limit(100);
    if (expertId) q = q.eq("expert_id", expertId);

    const { data, error } = await q;
    if (error) {
      logger.error("getGroupWorkshops failed", { error: error.message });
      return [];
    }
    return (data || []).map(mapWorkshop);
  } catch (error) {
    logger.error("getGroupWorkshops error", { error });
    return [];
  }
}

export async function joinWorkshop(workshopId: string): Promise<boolean> {
  try {
    const userId = await requireUserId();

    const { data: workshop, error: wErr } = await fromExtended("workshop_bookings")
      .select("id, price_per_person, currency, current_participants, max_participants")
      .eq("id", workshopId)
      .maybeSingle();

    if (wErr || !workshop) {
      toast.error("Workshop not found");
      return false;
    }

    const max = workshop.max_participants != null ? Number(workshop.max_participants) : null;
    const current = Number(workshop.current_participants ?? 0);
    if (max != null && current >= max) {
      toast.error("Workshop is full");
      return false;
    }

    const amount = Math.max(0, Number(workshop.price_per_person ?? 0));

    const { error } = await fromExtended("workshop_participants").insert({
      workshop_booking_id: workshopId,
      user_id: userId,
      amount_paid: amount,
      currency: String(workshop.currency ?? "USD"),
      payment_status: amount > 0 ? "pending" : "paid",
      payment_intent_id: null,
      attended: false,
      attendance_notes: null,
      rating: null,
      feedback_text: null,
    });

    if (error) {
      logger.error("joinWorkshop failed", { error: error.message });
      toast.error("Failed to join workshop");
      return false;
    }

    toast.success("Registered");
    return true;
  } catch (error) {
    logger.error("joinWorkshop error", { error });
    toast.error("Failed to join workshop");
    return false;
  }
}
