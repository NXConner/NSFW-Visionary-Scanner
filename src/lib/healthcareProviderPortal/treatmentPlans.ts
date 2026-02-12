import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { TreatmentPlan } from "./types";
import { logHIPAAAudit } from "./audit";
import { getHealthcareProvider } from "./providers";

export async function createTreatmentPlan(
  patientId: string,
  planName: string,
  planDescription: string,
  goals: string[],
  milestones: string[],
  timelineDays: number,
): Promise<TreatmentPlan | null> {
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

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + timelineDays);

    const { data, error } = await supabase
      .from("treatment_plans")
      .insert({
        provider_id: provider.id,
        patient_id: patientId,
        plan_name: planName,
        plan_description: planDescription,
        plan_data: {
          plan_name: planName,
          plan_description: planDescription,
          goals,
          milestones,
          timeline_days: timelineDays,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          progress_percentage: 0,
          milestones_completed: 0,
          plan_status: "draft",
        },
        goals,
        milestones,
        timeline_days: timelineDays,
        plan_status: "draft",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        progress_percentage: 0,
        milestones_completed: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create treatment plan", { error: error.message });
      toast.error("Failed to create treatment plan");
      return null;
    }

    await logHIPAAAudit(
      user.id,
      provider.id,
      "create",
      "treatment_plan",
      data.id,
      `Treatment plan created: ${planName}`,
    );

    toast.success("Treatment plan created");
    return data as unknown as TreatmentPlan;
  } catch (err) {
    logger.error("Error creating treatment plan", { error: err });
    toast.error("Failed to create treatment plan");
    return null;
  }
}

export async function getTreatmentPlans(patientId?: string): Promise<TreatmentPlan[]> {
  try {
    const provider = await getHealthcareProvider();
    if (!provider) return [];

    let query = supabase
      .from("treatment_plans")
      .select("*")
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false });

    if (patientId) query = query.eq("patient_id", patientId);

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to get treatment plans", { error: error.message });
      return [];
    }

    return (data || []) as unknown as TreatmentPlan[];
  } catch (err) {
    logger.error("Error getting treatment plans", { error: err });
    return [];
  }
}

export async function updateTreatmentPlanProgress(
  planId: string,
  progressPercentage: number,
  milestonesCompleted: number,
): Promise<TreatmentPlan | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const provider = await getHealthcareProvider();
    if (!provider) return null;

    const updates: Record<string, unknown> = {
      progress_percentage: progressPercentage,
      milestones_completed: milestonesCompleted,
      updated_at: new Date().toISOString(),
    };

    if (progressPercentage >= 100) {
      updates.plan_status = "completed";
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("treatment_plans")
      .update(updates)
      .eq("id", planId)
      .eq("provider_id", provider.id)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update treatment plan", { error: error.message });
      toast.error("Failed to update progress");
      return null;
    }

    toast.success("Progress updated");
    return data as unknown as TreatmentPlan;
  } catch (err) {
    logger.error("Error updating treatment plan", { error: err });
    return null;
  }
}
