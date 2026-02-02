import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { ProviderDashboardMetrics } from "./types";
import { getHealthcareProvider } from "./providers";

const EMPTY_METRICS: ProviderDashboardMetrics = {
  total_patients: 0,
  active_patients: 0,
  new_patients_this_month: 0,
  reports_generated: 0,
  active_treatment_plans: 0,
  average_patient_engagement: 0,
  upcoming_appointments: 0,
  unread_messages: 0,
};

export async function getProviderDashboardMetrics(): Promise<ProviderDashboardMetrics> {
  try {
    const provider = await getHealthcareProvider();
    if (!provider) return EMPTY_METRICS;

    const { count: totalPatients } = await supabase
      .from("patient_provider_relationships")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", provider.id);

    const { count: activePatients } = await supabase
      .from("patient_provider_relationships")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", provider.id)
      .eq("status", "active");

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { count: newPatients } = await supabase
      .from("patient_provider_relationships")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", provider.id)
      .gte("created_at", firstOfMonth.toISOString());

    const { count: reportsCount } = await supabase
      .from("provider_professional_reports")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", provider.id);

    const { count: activePlans } = await supabase
      .from("treatment_plans")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", provider.id)
      .eq("plan_status", "active");

    return {
      ...EMPTY_METRICS,
      total_patients: totalPatients || 0,
      active_patients: activePatients || 0,
      new_patients_this_month: newPatients || 0,
      reports_generated: reportsCount || 0,
      active_treatment_plans: activePlans || 0,
    };
  } catch (err) {
    logger.error("Error getting dashboard metrics", { error: err });
    return EMPTY_METRICS;
  }
}
