import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";

export type NsfwConsentPolicy = {
  policy_key: string;
  version: string;
  title: string;
  summary: string | null;
  body: string;
  required_for_features: string[];
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type NsfwConsentEvent = {
  id: string;
  user_id: string;
  policy_key: string;
  policy_version: string;
  consent_method: string;
  accepted_at: string;
  revoked_at: string | null;
  created_at: string;
};

export async function fetchActiveConsentPolicies(): Promise<NsfwConsentPolicy[]> {
  try {
    const { data, error } = await fromExtended("nsfw_consent_policies")
      .select("*")
      .eq("is_active", true)
      .order("policy_key", { ascending: true });
    if (error) {
      logger.error("nsfw consent: fetch policies failed", { error: error.message });
      return [];
    }
    return (data || []) as NsfwConsentPolicy[];
  } catch (err) {
    logger.error("nsfw consent: fetch policies error", { error: err });
    return [];
  }
}

export async function fetchUserConsentEvents(): Promise<NsfwConsentEvent[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await fromExtended("nsfw_consent_events")
      .select("*")
      .eq("user_id", user.id)
      .order("accepted_at", { ascending: false });
    if (error) {
      logger.error("nsfw consent: fetch events failed", { error: error.message });
      return [];
    }
    return (data || []) as NsfwConsentEvent[];
  } catch (err) {
    logger.error("nsfw consent: fetch events error", { error: err });
    return [];
  }
}

export async function recordConsent(params: {
  policyKey: string;
  policyVersion: string;
  consentMethod?: string;
}): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await fromExtended("nsfw_consent_events").upsert(
      {
        user_id: user.id,
        policy_key: params.policyKey,
        policy_version: params.policyVersion,
        consent_method: params.consentMethod || "in_app",
        accepted_at: new Date().toISOString(),
        revoked_at: null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,policy_key,policy_version" },
    );

    if (error) {
      logger.error("nsfw consent: record failed", { error: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("nsfw consent: record error", { error: err });
    return false;
  }
}

export async function revokeConsent(params: {
  policyKey: string;
  policyVersion: string;
}): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await fromExtended("nsfw_consent_events")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("policy_key", params.policyKey)
      .eq("policy_version", params.policyVersion);

    if (error) {
      logger.error("nsfw consent: revoke failed", { error: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("nsfw consent: revoke error", { error: err });
    return false;
  }
}
