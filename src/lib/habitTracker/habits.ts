import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { UserHabit } from "./types";

export async function getUserHabits(activeOnly: boolean = true): Promise<UserHabit[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("user_habits")
      .select(
        `
        *,
        habit_definition:habit_definitions(*)
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (activeOnly) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to get user habits", { error: error.message });
      return [];
    }
    return (data || []) as UserHabit[];
  } catch (err) {
    logger.error("Error getting user habits", { error: err });
    return [];
  }
}

export async function getHabitById(habitId: string): Promise<UserHabit | null> {
  try {
    const { data, error } = await supabase
      .from("user_habits")
      .select(
        `
        *,
        habit_definition:habit_definitions(*)
      `,
      )
      .eq("id", habitId)
      .maybeSingle();

    if (error) {
      logger.error("Failed to get habit", { error: error.message });
      return null;
    }
    return (data as UserHabit | null) ?? null;
  } catch (err) {
    logger.error("Error getting habit", { error: err });
    return null;
  }
}

export async function updateHabit(
  habitId: string,
  updates: Partial<UserHabit>,
): Promise<UserHabit | null> {
  try {
    const { data, error } = await supabase
      .from("user_habits")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", habitId)
      .select(
        `
        *,
        habit_definition:habit_definitions(*)
      `,
      )
      .single();

    if (error) {
      logger.error("Failed to update habit", { error: error.message });
      toast.error("Failed to update habit");
      return null;
    }

    toast.success("Habit updated");
    return data as UserHabit;
  } catch (err) {
    logger.error("Error updating habit", { error: err });
    toast.error("Failed to update habit");
    return null;
  }
}

export async function deleteHabit(habitId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_habits").delete().eq("id", habitId);

    if (error) {
      logger.error("Failed to delete habit", { error: error.message });
      toast.error("Failed to delete habit");
      return false;
    }

    toast.success("Habit deleted");
    return true;
  } catch (err) {
    logger.error("Error deleting habit", { error: err });
    toast.error("Failed to delete habit");
    return false;
  }
}
