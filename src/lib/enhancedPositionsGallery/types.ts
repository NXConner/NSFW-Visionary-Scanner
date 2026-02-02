export interface PositionDifficultyRating {
  id: string;
  position_id: string;
  user_id: string;
  difficulty_rating: number;
  physical_difficulty: number | null;
  coordination_difficulty: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PositionEffectivenessTracking {
  id: string;
  position_id: string;
  user_id: string;
  effectiveness_rating: number;
  pleasure_rating: number | null;
  intensity_rating: number | null;
  comfort_rating: number | null;
  session_date: string | null;
  partner_feedback: string | null;
  notes: string | null;
  created_at: string;
}

export interface PositionReview {
  id: string;
  position_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  tips: string[] | null;
  pros: string[] | null;
  cons: string[] | null;
  times_tried: number;
  would_recommend: boolean | null;
  is_approved: boolean;
  is_featured: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface PositionPlaylist {
  id: string;
  user_id: string;
  playlist_name: string;
  description: string | null;
  is_public: boolean;
  is_featured: boolean;
  position_ids: string[];
  position_count: number;
  view_count: number;
  copy_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface PositionRecommendation {
  id: string;
  user_id: string;
  position_id: string;
  recommendation_type:
    | "similar"
    | "next_level"
    | "complementary"
    | "trending"
    | "personalized"
    | null;
  confidence_score: number | null;
  reasoning: string | null;
  ai_model_version: string | null;
  was_viewed: boolean;
  was_tried: boolean;
  user_feedback: string | null;
  recommended_at: string;
  created_at: string;
}

export interface PositionComparison {
  id: string;
  user_id: string;
  position_ids: string[];
  comparison_name: string | null;
  comparison_results: unknown;
  insights: string[] | null;
  created_at: string;
}
