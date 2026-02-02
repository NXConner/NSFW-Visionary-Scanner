import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { HealthcareProvider } from "./types";
import { logHIPAAAudit } from "./audit";

export async function createHealthcareProvider(
  providerData: Partial<HealthcareProvider>,
): Promise<HealthcareProvider | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to create a provider profile");
      return null;
    }

    const { data, error } = await supabase
      .from("healthcare_providers")
      .insert({
        user_id: user.id,
        provider_name: providerData.provider_name || "",
        provider_type: providerData.provider_type || "doctor",
        specialty: providerData.specialty || [],
        credentials: providerData.credentials || [],
        license_number: providerData.license_number,
        license_state: providerData.license_state,
        email: providerData.email || user.email || "",
        phone: providerData.phone,
        address: providerData.address,
        website: providerData.website,
        subscription_tier: "basic",
        subscription_status: "active",
        hipaa_compliant: false,
        baa_signed: false,
        max_patients: 100,
        current_patient_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create provider profile", { error: error.message });
      toast.error("Failed to create provider profile");
      return null;
    }

    await logHIPAAAudit(
      user.id,
      data.id,
      "create",
      "provider_profile",
      data.id,
      "Provider profile created",
    );

    toast.success("Provider profile created successfully!");
    logger.info("Provider profile created", { providerId: data.id });
    return data as HealthcareProvider;
  } catch (err) {
    logger.error("Error creating provider", { error: err });
    toast.error("Failed to create provider profile");
    return null;
  }
}

export async function getHealthcareProvider(): Promise<HealthcareProvider | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("healthcare_providers")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Failed to get provider profile", { error: error.message });
      return null;
    }

    return data as HealthcareProvider | null;
  } catch (err) {
    logger.error("Error getting provider", { error: err });
    return null;
  }
}

export async function updateHealthcareProvider(
  providerId: string,
  updates: Partial<HealthcareProvider>,
): Promise<HealthcareProvider | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("healthcare_providers")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", providerId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update provider", { error: error.message });
      toast.error("Failed to update provider profile");
      return null;
    }

    await logHIPAAAudit(
      user.id,
      providerId,
      "update",
      "provider_profile",
      providerId,
      "Provider profile updated",
    );
    toast.success("Provider profile updated");
    return data as HealthcareProvider;
  } catch (err) {
    logger.error("Error updating provider", { error: err });
    return null;
  }
}
