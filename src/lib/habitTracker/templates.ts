import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { HabitDefinition, HabitTemplate, UserHabit } from "./types";

type HabitDefinitionRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  frequency: string;
  target_value: number | string | null;
  unit: string | null;
  icon: string | null;
  color: string | null;
};

function mapDefinitionToTemplate(d: HabitDefinitionRow): HabitTemplate {
  return {
    id: d.id,
    name: String(d.name),
    description: d.description ?? null,
    category: d.category ?? null,
    frequency: String(d.frequency),
    target_value: d.target_value != null ? Number(d.target_value) : null,
    unit: d.unit ?? null,
    icon: d.icon ?? null,
    color: d.color ?? null,
    is_featured: false,
  };
}

export async function getHabitTemplates(): Promise<HabitTemplate[]> {
  try {
    const { data, error } = await supabase
      .from("habit_definitions")
      .select("*")
      .eq("is_template", true)
      .order("name");

    if (error) {
      logger.error("Failed to get habit templates", { error: error.message });
      return [];
    }

    return ((data || []) as HabitDefinitionRow[]).map(mapDefinitionToTemplate);
  } catch (err) {
    logger.error("Error getting templates", { error: err });
    return [];
  }
}

export async function createHabitFromTemplate(templateId: string): Promise<UserHabit | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return null;
    }

    const { data: template, error: templateError } = await supabase
      .from("habit_definitions")
      .select("*")
      .eq("id", templateId)
      .eq("is_template", true)
      .maybeSingle();

    if (templateError || !template) {
      toast.error("Template not found");
      return null;
    }

    const { data: userHabit, error: habitError } = await supabase
      .from("user_habits")
      .insert({
        user_id: user.id,
        habit_definition_id: template.id,
        custom_name: template.name,
        is_active: true,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
        completion_rate: 0,
      })
      .select(
        `
        *,
        habit_definition:habit_definitions(*)
      `,
      )
      .single();

    if (habitError) {
      logger.error("Failed to create habit from template", { error: habitError.message });
      toast.error("Failed to create habit");
      return null;
    }

    toast.success("Habit created from template!");
    return userHabit as UserHabit;
  } catch (err) {
    logger.error("Error creating habit from template", { error: err });
    toast.error("Failed to create habit");
    return null;
  }
}

export async function createHabit(habitData: Partial<HabitDefinition>): Promise<UserHabit | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return null;
    }

    const { data: definition, error: defError } = await supabase
      .from("habit_definitions")
      .insert({
        user_id: user.id,
        name: habitData.name || "New Habit",
        description: habitData.description,
        category: habitData.category || "custom",
        frequency: habitData.frequency || "daily",
        target_value: habitData.target_value || 1,
        unit: habitData.unit || "times",
        color: habitData.color || "#4CAF50",
        icon: habitData.icon || "💪",
        is_template: false,
        is_active: true,
      })
      .select()
      .single();

    if (defError) {
      logger.error("Failed to create habit definition", { error: defError.message });
      toast.error("Failed to create habit");
      return null;
    }

    const { data: userHabit, error: habitError } = await supabase
      .from("user_habits")
      .insert({
        user_id: user.id,
        habit_definition_id: definition.id,
        custom_name: habitData.name,
        is_active: true,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
        completion_rate: 0,
      })
      .select(
        `
        *,
        habit_definition:habit_definitions(*)
      `,
      )
      .single();

    if (habitError) {
      logger.error("Failed to create user habit", { error: habitError.message });
      toast.error("Failed to create habit");
      return null;
    }

    toast.success("Habit created!");
    return userHabit as UserHabit;
  } catch (err) {
    logger.error("Error creating habit", { error: err });
    toast.error("Failed to create habit");
    return null;
  }
}
