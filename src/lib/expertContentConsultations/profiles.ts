import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { ExpertProfile } from "@/lib/expertContentConsultations/types";

function mapExpertProfile(row: any): ExpertProfile {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    display_name: String(row.expert_name ?? ""),
    bio: row.bio ?? null,
    specialties: Array.isArray(row.specialties) ? row.specialties.map(String) : [],
    credentials: Array.isArray(row.credentials) ? row.credentials.map(String) : null,
    years_experience: row.years_experience ?? null,
    profile_image_url: row.profile_image_url ?? null,
    availability_schedule: row.availability_schedule ?? null,
    consultation_rate_per_hour: Number(row.consultation_rate_per_hour ?? 0),
    group_workshop_rate_per_person:
      row.workshop_rate_per_person != null ? Number(row.workshop_rate_per_person) : null,
    currency: String(row.currency ?? "USD"),
    is_verified: Boolean(row.is_verified),
    is_available: Boolean(row.is_active),
    rating: Number(row.average_rating ?? 0),
    review_count: Number(row.total_ratings ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function getExpertProfiles(
  featured?: boolean,
  specialty?: string,
): Promise<ExpertProfile[]> {
  try {
    let q = fromExtended("expert_profiles")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("average_rating", { ascending: false })
      .order("total_ratings", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (featured) q = q.eq("is_featured", true);
    if (specialty) q = q.contains("specialties", [String(specialty)]);

    const { data, error } = await q;
    if (error) {
      logger.error("getExpertProfiles failed", { error: error.message });
      return [];
    }

    return (data || []).map(mapExpertProfile);
  } catch (error) {
    logger.error("getExpertProfiles error", { error });
    return [];
  }
}

export async function getExpertProfile(expertId: string): Promise<ExpertProfile | null> {
  try {
    const { data, error } = await fromExtended("expert_profiles")
      .select("*")
      .eq("id", expertId)
      .maybeSingle();

    if (error) {
      logger.error("getExpertProfile failed", { error: error.message, expertId });
      return null;
    }

    return data ? mapExpertProfile(data) : null;
  } catch (error) {
    logger.error("getExpertProfile error", { error, expertId });
    return null;
  }
}
