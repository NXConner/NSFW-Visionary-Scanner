import { toast } from "sonner";

import { logger } from "@/lib/logger";

import type { JsonObject, RoutineTemplate } from "../types";
import type { MultiWeekProgram } from "../advancedTypes";
import { db, requireUserId } from "./common";

function mapProgram(r: any): MultiWeekProgram {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    base_template_id: r.base_template_id ?? null,
    program_name: String(r.program_name ?? ""),
    description: r.description ?? null,
    total_weeks: Number(r.total_weeks ?? 0),
    current_week: Number(r.current_week ?? 1),
    weekly_schedules: (r.phases ?? null) as JsonObject | null,
    progress_milestones: (r.milestones ?? null) as JsonObject | null,
    status: (r.status as MultiWeekProgram["status"]) ?? "active",
    start_date: r.start_date ?? null,
    target_end_date: r.target_end_date ?? null,
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
  };
}

export async function getMultiWeekPrograms(): Promise<MultiWeekProgram[]> {
  try {
    const userId = await requireUserId();

    const { data, error } = await db
      .from("multi_week_programs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("getMultiWeekPrograms failed", { error: error.message });
      return [];
    }

    return (data || []).map(mapProgram);
  } catch (error) {
    logger.error("getMultiWeekPrograms error", { error });
    return [];
  }
}

export async function createMultiWeekProgram(
  programName: string,
  totalWeeks: number,
  baseTemplateId?: string,
): Promise<MultiWeekProgram | null> {
  try {
    const userId = await requireUserId();

    let template: RoutineTemplate | null = null;
    if (baseTemplateId) {
      const { data } = await db
        .from("routine_templates")
        .select("*")
        .eq("id", baseTemplateId)
        .maybeSingle();
      if (data) template = data as RoutineTemplate;
    }

    // Program phases must exist; if no template, require user-defined phases externally.
    if (!template) {
      toast.error("Select a template to create a program");
      return null;
    }

    const startDate = new Date().toISOString().slice(0, 10);
    const phases = [
      {
        phase_number: 1,
        phase_name: "Base phase",
        description: "Generated from selected template",
        duration_weeks: totalWeeks,
        start_week: 1,
        end_week: totalWeeks,
        phase_routine: {
          template_id: template.id,
          template_name: template.template_name,
          exercises: template.exercises,
          sessions_per_week: template.sessions_per_week ?? null,
        },
      },
    ] as unknown as JsonObject;

    const { data, error } = await db
      .from("multi_week_programs")
      .insert({
        user_id: userId,
        base_template_id: baseTemplateId ?? null,
        program_name: programName,
        description: template.description ?? null,
        total_weeks: Math.max(1, Math.min(52, Number(totalWeeks))),
        current_week: 1,
        phases,
        start_date: startDate,
        target_end_date: null,
        actual_end_date: null,
        completion_percentage: 0,
        weeks_completed: 0,
        status: "active",
        program_goals: template.target_goals ?? null,
        milestones: null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("createMultiWeekProgram failed", { error: error.message });
      toast.error("Failed to create program");
      return null;
    }

    toast.success("Program created");
    return mapProgram(data);
  } catch (error) {
    logger.error("createMultiWeekProgram error", { error });
    toast.error("Failed to create program");
    return null;
  }
}
