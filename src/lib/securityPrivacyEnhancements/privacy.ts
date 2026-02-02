import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { PrivacyControls } from "./types";

type PrivacyRow = {
  id: string;
  user_id: string;
  share_analytics: boolean | null;
  share_usage_data: boolean | null;
  share_location_data: boolean | null;
  anonymize_data: boolean | null;
  profile_visibility: "public" | "friends" | "private" | null;
  created_at: string;
  updated_at: string;
};

function mapPrivacy(row: PrivacyRow): PrivacyControls {
  return {
    id: row.id,
    user_id: row.user_id,
    share_analytics: Boolean(row.share_analytics),
    share_usage_data: Boolean(row.share_usage_data),
    share_location_data: Boolean(row.share_location_data),
    anonymize_data: Boolean(row.anonymize_data),
    profile_visibility: (row.profile_visibility ??
      "private") as PrivacyControls["profile_visibility"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getPrivacyControls(): Promise<PrivacyControls | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await fromExtended("privacy_controls")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      logger.error("Failed to get privacy controls", { error: error.message });
      return null;
    }

    if (data) return mapPrivacy(data as PrivacyRow);

    const { data: created, error: createErr } = await fromExtended("privacy_controls")
      .insert({
        user_id: user.id,
        share_analytics: false,
        share_usage_data: false,
        share_location_data: false,
        anonymize_data: false,
        profile_visibility: "private",
      })
      .select("*")
      .single();

    if (createErr) {
      logger.error("Failed to create privacy controls", { error: createErr.message });
      return null;
    }

    return mapPrivacy(created as PrivacyRow);
  } catch (err) {
    logger.error("Error getting privacy controls", { error: err });
    return null;
  }
}

export async function updatePrivacyControls(
  updates: Partial<PrivacyControls>,
): Promise<PrivacyControls | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: existing } = await fromExtended("privacy_controls")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing?.id) {
      await getPrivacyControls();
    }

    const { data, error } = await fromExtended("privacy_controls")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      logger.error("Error updating privacy controls", { error: error.message });
      toast.error("Failed to update privacy settings");
      return null;
    }

    toast.success("Privacy settings updated");
    return mapPrivacy(data as PrivacyRow);
  } catch (err) {
    logger.error("Error updating privacy controls", { error: err });
    toast.error("Failed to update privacy settings");
    return null;
  }
}
