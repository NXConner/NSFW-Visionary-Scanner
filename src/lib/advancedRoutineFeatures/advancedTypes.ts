import type { JsonObject } from "./types";

export interface AdaptiveRoutine {
  id: string;
  user_id: string;
  base_template_id: string | null;
  routine_name: string;
  adaptation_reason: string | null;
  user_profile: JsonObject | null;
  adaptation_history: JsonObject | null;
  current_exercises: JsonObject | null;
  current_schedule: JsonObject | null;
  difficulty_adjustment: number;
  ai_model_version: string | null;
  adaptation_confidence: number | null;
  last_adapted_at: string | null;
  adaptation_count: number;
  status: "active" | "paused" | "completed" | "abandoned";
  start_date: string | null;
  target_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedRoutine {
  id: string;
  routine_id: string | null;
  user_id: string;
  share_name: string;
  description: string | null;
  is_public: boolean;
  share_token: string | null;
  shared_with_users: string[] | null;
  routine_data: JsonObject | null;
  view_count: number;
  copy_count: number;
  rating_average: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface RoutineMarketplaceItem {
  id: string;
  template_id: string | null;
  creator_id: string;
  price: number;
  currency: string;
  is_subscription: boolean;
  subscription_duration_days: number | null;
  marketplace_category: string | null;
  tags: string[] | null;
  featured_image_url: string | null;
  preview_video_url: string | null;
  sales_count: number;
  revenue_total: number;
  average_rating: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestDayRecommendation {
  id: string;
  user_id: string;
  routine_id: string | null;
  recommended_date: string;
  recommendation_type:
    | "scheduled"
    | "recovery"
    | "injury_prevention"
    | "overtraining"
    | "fatigue"
    | null;
  reason: string;
  factors_considered: JsonObject | null;
  confidence: number | null;
  was_followed: boolean | null;
  user_feedback: string | null;
  recommended_at: string;
  created_at: string;
}

export interface MultiWeekProgram {
  id: string;
  user_id: string;
  base_template_id: string | null;
  program_name: string;
  description: string | null;
  total_weeks: number;
  current_week: number;
  weekly_schedules: JsonObject | null;
  progress_milestones: JsonObject | null;
  status: "active" | "paused" | "completed" | "abandoned";
  start_date: string | null;
  target_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoGuidedRoutine {
  id: string;
  routine_id: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  instructor_name: string | null;
  difficulty_level: string | null;
  is_premium: boolean;
  view_count: number;
  created_at: string;
}

export interface RoutineAnalytics {
  routine_id: string;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  average_session_duration: number;
  total_time_spent: number;
  streak_current: number;
  streak_longest: number;
  last_session_at: string | null;
}
