import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { HabitStreak } from "./types";

export async function getHabitStreaks(userHabitId: string): Promise<HabitStreak[]> {
  try {
    const { data, error } = await supabase
      .from("habit_streaks")
      .select("*")
      .eq("user_habit_id", userHabitId)
      .order("streak_start_date", { ascending: false });

    if (error) {
      logger.error("Failed to get habit streaks", { error: error.message });
      return [];
    }

    return (data || []) as HabitStreak[];
  } catch (err) {
    logger.error("Error getting habit streaks", { error: err });
    return [];
  }
}
