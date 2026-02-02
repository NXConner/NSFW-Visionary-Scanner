import { logger } from "@/lib/logger";
import type { HabitAnalytics, TodayHabitStatus, TodayProgress, UserHabit } from "./types";
import { getHabitEntries } from "./entries";
import { getHabitById, getUserHabits } from "./habits";

export async function getHabitAnalytics(userHabitId: string): Promise<HabitAnalytics> {
  try {
    const entries = await getHabitEntries(userHabitId);
    const habit = await getHabitById(userHabitId);

    const completedEntries = entries.filter(e => Number(e.completed_value || 0) > 0);
    const totalValue = completedEntries.reduce((sum, e) => sum + Number(e.completed_value || 0), 0);

    const weeklyTrend: number[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const entry = entries.find(e => e.entry_date === dateStr);
      weeklyTrend.push(Number(entry?.completed_value || 0));
    }

    const monthlyTrend: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const entry = entries.find(e => e.entry_date === dateStr);
      monthlyTrend.push(Number(entry?.completed_value || 0));
    }

    const moodDistribution: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.mood) moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
    }

    return {
      completionRate: Number(habit?.completion_rate || 0),
      totalEntries: entries.length,
      completedEntries: completedEntries.length,
      currentStreak: Number(habit?.current_streak || 0),
      longestStreak: Number(habit?.longest_streak || 0),
      averageValue: completedEntries.length > 0 ? totalValue / completedEntries.length : 0,
      weeklyTrend,
      monthlyTrend,
      moodDistribution,
      bestDay: null,
      worstDay: null,
    };
  } catch (err) {
    logger.error("Error getting habit analytics", { error: err });
    return {
      completionRate: 0,
      totalEntries: 0,
      completedEntries: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageValue: 0,
      weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
      monthlyTrend: Array(30).fill(0),
      moodDistribution: {},
      bestDay: null,
      worstDay: null,
    };
  }
}

export async function getTodayHabitStatus(): Promise<TodayHabitStatus> {
  try {
    const habits = await getUserHabits(true);
    const today = new Date().toISOString().split("T")[0];

    const completed: string[] = [];
    const pending: string[] = [];

    for (const habit of habits) {
      if (!habit.id) continue;
      const entries = await getHabitEntries(habit.id, today, today);
      if (entries.length > 0 && Number(entries[0].completed_value || 0) > 0)
        completed.push(habit.id);
      else pending.push(habit.id);
    }

    return { habits, completed, pending };
  } catch (err) {
    logger.error("Error getting today status", { error: err });
    return { habits: [], completed: [], pending: [] };
  }
}

export async function getTodayProgress(): Promise<TodayProgress> {
  const status = await getTodayHabitStatus();
  return { completed: status.completed.length, total: status.habits.length, habits: status.habits };
}

export function getHabitDisplayName(habit: UserHabit): string {
  return habit.custom_name || habit.habit_definition?.name || "Habit";
}
