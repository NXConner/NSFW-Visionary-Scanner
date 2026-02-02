import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { PatientProviderRelationship } from "./types";
import { logHIPAAAudit } from "./audit";
import { getHealthcareProvider } from "./providers";

export async function grantProviderAccess(
  providerId: string,
  consentScope: string[],
  accessLevel: string = "read",
): Promise<PatientProviderRelationship | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return null;
    }

    const consentDate = new Date();
    const expiresDate = new Date();
    expiresDate.setFullYear(expiresDate.getFullYear() + 1);

    const { data, error } = await supabase
      .from("patient_provider_relationships")
      .insert({
        patient_id: user.id,
        provider_id: providerId,
        consent_granted: true,
        consent_date: consentDate.toISOString(),
        consent_expires_date: expiresDate.toISOString(),
        consent_scope: consentScope,
        relationship_type: "primary",
        status: "active",
        access_level: accessLevel,
        can_view_scans: consentScope.includes("scans"),
        can_view_diary: consentScope.includes("diary"),
        can_view_analytics: consentScope.includes("analytics"),
        can_view_reports: consentScope.includes("reports"),
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to grant provider access", { error: error.message });
      toast.error("Failed to grant access");
      return null;
    }

    await supabase.rpc("increment_patient_count", { p_provider_id: providerId });

    await logHIPAAAudit(
      user.id,
      providerId,
      "share",
      "patient_data",
      data.id,
      `Patient granted access: ${consentScope.join(", ")}`,
    );

    toast.success("Access granted to provider");
    return data as PatientProviderRelationship;
  } catch (err) {
    logger.error("Error granting provider access", { error: err });
    toast.error("Failed to grant access");
    return null;
  }
}

export async function revokeProviderAccess(relationshipId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: relationship } = await supabase
      .from("patient_provider_relationships")
      .select("provider_id")
      .eq("id", relationshipId)
      .eq("patient_id", user.id)
      .single();

    if (!relationship) {
      toast.error("Relationship not found");
      return false;
    }

    const { error } = await supabase
      .from("patient_provider_relationships")
      .update({
        status: "revoked",
        consent_granted: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", relationshipId)
      .eq("patient_id", user.id);

    if (error) {
      logger.error("Failed to revoke access", { error: error.message });
      toast.error("Failed to revoke access");
      return false;
    }

    await logHIPAAAudit(
      user.id,
      relationship.provider_id,
      "access_denied",
      "patient_data",
      relationshipId,
      "Patient revoked provider access",
    );

    toast.success("Provider access revoked");
    return true;
  } catch (err) {
    logger.error("Error revoking access", { error: err });
    return false;
  }
}

export async function getPatientRelationships(): Promise<PatientProviderRelationship[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const provider = await getHealthcareProvider();
    if (provider) {
      const { data: asProvider } = await supabase
        .from("patient_provider_relationships")
        .select(
          `
          *,
          provider:healthcare_providers(*)
        `,
        )
        .eq("provider_id", provider.id)
        .eq("status", "active");

      if (asProvider && asProvider.length > 0) {
        return asProvider as PatientProviderRelationship[];
      }
    }

    const { data, error } = await supabase
      .from("patient_provider_relationships")
      .select(
        `
        *,
        provider:healthcare_providers(*)
      `,
      )
      .eq("patient_id", user.id)
      .eq("status", "active");

    if (error) {
      logger.error("Failed to get relationships", { error: error.message });
      return [];
    }

    return (data || []) as PatientProviderRelationship[];
  } catch (err) {
    logger.error("Error getting relationships", { error: err });
    return [];
  }
}

export async function getProviderPatients(
  providerId: string,
): Promise<PatientProviderRelationship[]> {
  try {
    const { data, error } = await supabase
      .from("patient_provider_relationships")
      .select("*")
      .eq("provider_id", providerId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to get provider patients", { error: error.message });
      return [];
    }

    return (data || []) as PatientProviderRelationship[];
  } catch (err) {
    logger.error("Error getting provider patients", { error: err });
    return [];
  }
}
