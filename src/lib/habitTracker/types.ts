export interface HabitDefinition {
  id?: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  frequency: string;
  target_value?: number | null;
  unit?: string | null;
  reminder_enabled?: boolean | null;
  reminder_times?: string[] | null;
  reminder_days?: number[] | null;
  linked_routine_id?: string | null;
  linked_feature?: string | null;
  color?: string | null;
  icon?: string | null;
  order_index?: number | null;
  is_active?: boolean | null;
  is_template?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UserHabit {
  id?: string;
  user_id?: string | null;
  habit_definition_id: string;
  custom_name?: string | null;
  custom_target_value?: number | null;
  is_active?: boolean | null;
  started_at?: string | null;
  paused_at?: string | null;
  archived_at?: string | null;
  current_streak?: number | null;
  longest_streak?: number | null;
  total_completions?: number | null;
  completion_rate?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  habit_definition?: HabitDefinition;
}

export interface HabitEntry {
  id?: string;
  user_habit_id: string;
  entry_date: string;
  completed_value?: number | null;
  target_value?: number | null;
  notes?: string | null;
  mood?: string | null;
  difficulty_rating?: number | null;
  duration_minutes?: number | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HabitStreak {
  id?: string;
  user_habit_id: string;
  streak_start_date: string;
  streak_end_date?: string | null;
  streak_length?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HabitTemplate {
  id?: string;
  name: string;
  description?: string | null;
  category?: string | null;
  frequency: string;
  target_value?: number | null;
  unit?: string | null;
  icon?: string | null;
  color?: string | null;
  is_featured?: boolean | null;
  usage_count?: number | null;
  created_at?: string | null;
}

export interface HabitAnalytics {
  completionRate: number;
  totalEntries: number;
  completedEntries: number;
  currentStreak: number;
  longestStreak: number;
  averageValue: number;
  weeklyTrend: number[];
  monthlyTrend: number[];
  moodDistribution: Record<string, number>;
  bestDay: string | null;
  worstDay: string | null;
}

export type TodayHabitStatus = {
  habits: UserHabit[];
  completed: string[];
  pending: string[];
};

export type TodayProgress = { completed: number; total: number; habits: UserHabit[] };
