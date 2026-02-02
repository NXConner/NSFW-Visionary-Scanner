import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { LoginHistory } from "./types";

type LoginRow = {
  id: string;
  user_id: string;
  login_method: LoginHistory["login_method"];
  login_status: LoginHistory["login_status"];
  location_city: string | null;
  location_country: string | null;
  is_suspicious: boolean | null;
  failure_reason: string | null;
  logged_at: string;
};

export async function getLoginHistory(limit: number = 20): Promise<LoginHistory[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await fromExtended("login_history")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Error getting login history", { error: error.message });
      return [];
    }
    return (data || []) as LoginHistory[];
  } catch (err) {
    logger.error("Error getting login history", { error: err });
    return [];
  }
}

export async function recordLogin(
  method: LoginHistory["login_method"],
  status: LoginHistory["login_status"],
  details?: Partial<LoginRow>,
): Promise<LoginHistory | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await fromExtended("login_history")
      .insert({
        user_id: user.id,
        login_method: method,
        login_status: status,
        location_city: details?.location_city ?? null,
        location_country: details?.location_country ?? null,
        is_suspicious: Boolean(details?.is_suspicious),
        failure_reason: details?.failure_reason ?? null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Error recording login", { error: error.message });
      return null;
    }
    return data as LoginHistory;
  } catch (err) {
    logger.error("Error recording login", { error: err });
    return null;
  }
}
