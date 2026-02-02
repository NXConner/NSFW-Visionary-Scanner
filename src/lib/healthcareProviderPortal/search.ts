import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { HealthcareProvider } from "./types";

export async function searchHealthcareProviders(
  searchQuery?: string,
  specialty?: string,
): Promise<HealthcareProvider[]> {
  try {
    let query = supabase
      .from("healthcare_providers")
      .select("*")
      .eq("is_active", true)
      .order("provider_name");

    if (searchQuery) {
      query = query.or(`provider_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    if (specialty) {
      query = query.contains("specialty", [specialty]);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Failed to search providers", { error: error.message });
      return [];
    }

    return (data || []) as HealthcareProvider[];
  } catch (err) {
    logger.error("Error searching providers", { error: err });
    return [];
  }
}
