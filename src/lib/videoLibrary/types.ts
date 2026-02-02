export interface Video {
  id?: string;
  title: string;
  description?: string | null;
  category:
    | "education"
    | "exercise"
    | "technique"
    | "expert_interview"
    | "webinar"
    | "tutorial"
    | "nsfw_instructional";
  video_url: string;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  file_size_bytes?: number | null;
  instructor_name?: string | null;
  instructor_credentials?: string | null;
  difficulty_level?: "beginner" | "intermediate" | "advanced" | null;
  tags?: string[] | null;
  is_featured?: boolean | null;
  is_premium?: boolean | null;
  is_nsfw?: boolean | null;
  order_index?: number | null;
  view_count?: number | null;
  like_count?: number | null;
  rating_average?: number | null;
  rating_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface VideoPlaylist {
  id?: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  is_public?: boolean | null;
  is_featured?: boolean | null;
  video_count?: number | null;
  view_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  videos?: Video[];
  video_ids?: string[];
}

export interface VideoProgress {
  id?: string;
  user_id?: string | null;
  video_id: string;
  progress_seconds?: number | null;
  progress_percentage?: number | null;
  is_completed?: boolean | null;
  completed_at?: string | null;
  watch_count?: number | null;
  last_watched_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface VideoBookmark {
  id?: string;
  user_id?: string | null;
  video_id: string;
  notes?: string | null;
  created_at?: string | null;
  video?: Video;
}

export interface VideoDownload {
  id?: string;
  user_id?: string | null;
  video_id: string;
  download_status?: "pending" | "downloading" | "completed" | "failed" | null;
  download_progress?: number | null;
  local_file_path?: string | null;
  file_size_bytes?: number | null;
  downloaded_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface VideoRating {
  id?: string;
  user_id?: string | null;
  video_id: string;
  rating: number;
  review_text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
