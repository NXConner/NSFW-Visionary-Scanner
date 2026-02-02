import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { JsonObject, ProviderProfessionalReport } from "./types";
import { logHIPAAAudit } from "./audit";
import { getHealthcareProvider } from "./providers";

export async function createProfessionalReport(
  patientId: string,
  reportType: string,
  reportTitle: string,
  reportContent: JsonObject,
  findings?: string[],
  recommendations?: string[],
): Promise<ProviderProfessionalReport | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return null;
    }

    const provider = await getHealthcareProvider();
    if (!provider) {
      toast.error("Provider profile required");
      return null;
    }

    const { data: relationship } = await supabase
      .from("patient_provider_relationships")
      .select("id")
      .eq("provider_id", provider.id)
      .eq("patient_id", patientId)
      .eq("status", "active")
      .single();

    if (!relationship) {
      toast.error("No active relationship with this patient");
      return null;
    }

    const { data, error } = await fromExtended("provider_reports")
      .insert({
        provider_id: provider.id,
        patient_id: patientId,
        report_type: reportType,
        report_title: reportTitle,
        report_content: reportContent as unknown as Record<string, unknown>,
        findings: findings || [],
        recommendations: recommendations || [],
        report_status: "draft",
        is_shared_with_patient: false,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create report", { error: error.message });
      toast.error("Failed to create report");
      return null;
    }

    await logHIPAAAudit(
      user.id,
      provider.id,
      "create",
      "report",
      data.id,
      `Report created: ${reportTitle}`,
    );

    toast.success("Report created");
    return data as unknown as ProviderProfessionalReport;
  } catch (err) {
    logger.error("Error creating report", { error: err });
    toast.error("Failed to create report");
    return null;
  }
}

export async function getProviderReports(
  patientId?: string,
  status?: string,
): Promise<ProviderProfessionalReport[]> {
  try {
    const provider = await getHealthcareProvider();
    if (!provider) return [];

    let query = supabase
      .from("provider_reports")
      .select("*")
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false });

    if (patientId) query = query.eq("patient_id", patientId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to get reports", { error: error.message });
      return [];
    }

    return (data || []) as unknown as ProviderProfessionalReport[];
  } catch (err) {
    logger.error("Error getting reports", { error: err });
    return [];
  }
}

export async function shareReportWithPatient(reportId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const provider = await getHealthcareProvider();
    if (!provider) return false;

    const { error } = await supabase
      .from("provider_reports")
      .update({
        is_shared_with_patient: true,
        shared_at: new Date().toISOString(),
        status: "shared",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("provider_id", provider.id);

    if (error) {
      logger.error("Failed to share report", { error: error.message });
      toast.error("Failed to share report");
      return false;
    }

    await logHIPAAAudit(
      user.id,
      provider.id,
      "share",
      "report",
      reportId,
      "Report shared with patient",
    );

    toast.success("Report shared with patient");
    return true;
  } catch (err) {
    logger.error("Error sharing report", { error: err });
    return false;
  }
}
