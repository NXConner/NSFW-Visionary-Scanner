import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { HabitEntry } from "./types";

async function updateHabitStats(userHabitId: string): Promise<void> {
  try {
    const { data: entries } = await supabase
      .from("habit_entries")
      .select("*")
      .eq("user_habit_id", userHabitId)
      .order("entry_date", { ascending: false });

    if (!entries || entries.length === 0) return;

    const totalCompletions = entries.filter((e: any) => Number(e.completed_value || 0) > 0).length;

    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    const sortedDates = entries
      .filter((e: any) => Number(e.completed_value || 0) > 0)
      .map((e: any) => String(e.entry_date))
      .sort((a: string, b: string) => b.localeCompare(a));

    if (sortedDates.length > 0) {
      let checkDate = new Date(today);
      for (const dateStr of sortedDates) {
        const entryDate = new Date(dateStr);
        const checkDateStr = checkDate.toISOString().split("T")[0];

        const prevDay = new Date(checkDate.getTime() - 86400000).toISOString().split("T")[0];
        if (dateStr === checkDateStr || dateStr === prevDay) {
          currentStreak++;
          checkDate = new Date(entryDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    const { data: habit } = await supabase
      .from("user_habits")
      .select("longest_streak")
      .eq("id", userHabitId)
      .maybeSingle();
    const longestStreak = Math.max(currentStreak, Number((habit as any)?.longest_streak || 0));

    await supabase
      .from("user_habits")
      .update({
        total_completions: totalCompletions,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        completion_rate: entries.length > 0 ? (totalCompletions / entries.length) * 100 : 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userHabitId);
  } catch (err) {
    logger.error("Error updating habit stats", { error: err });
  }
}

export async function logHabitEntry(
  userHabitId: string,
  entryDate: string,
  completedValue: number,
  notes?: string,
  mood?: string,
): Promise<HabitEntry | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return null;
    }

    const { data: existing } = await supabase
      .from("habit_entries")
      .select("id")
      .eq("user_habit_id", userHabitId)
      .eq("entry_date", entryDate)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("habit_entries")
        .update({
          completed_value: completedValue,
          notes,
          mood,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        logger.error("Failed to update habit entry", { error: error.message });
        toast.error("Failed to log entry");
        return null;
      }

      toast.success("Entry updated!");
      return data as HabitEntry;
    }

    const { data, error } = await supabase
      .from("habit_entries")
      .insert({
        user_habit_id: userHabitId,
        entry_date: entryDate,
        completed_value: completedValue,
        notes,
        mood,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create habit entry", { error: error.message });
      toast.error("Failed to log entry");
      return null;
    }

    await updateHabitStats(userHabitId);
    toast.success("Entry logged!");
    return data as HabitEntry;
  } catch (err) {
    logger.error("Error logging habit entry", { error: err });
    toast.error("Failed to log entry");
    return null;
  }
}

export async function getHabitEntries(
  userHabitId: string,
  startDate?: string,
  endDate?: string,
): Promise<HabitEntry[]> {
  try {
    let query = supabase
      .from("habit_entries")
      .select("*")
      .eq("user_habit_id", userHabitId)
      .order("entry_date", { ascending: false });
    if (startDate) query = query.gte("entry_date", startDate);
    if (endDate) query = query.lte("entry_date", endDate);

    const { data, error } = await query;
    if (error) {
      logger.error("Failed to get habit entries", { error: error.message });
      return [];
    }
    return (data || []) as HabitEntry[];
  } catch (err) {
    logger.error("Error getting habit entries", { error: err });
    return [];
  }
}
