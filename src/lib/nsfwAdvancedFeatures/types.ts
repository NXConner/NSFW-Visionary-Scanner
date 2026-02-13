export type JsonObject = Record<string, unknown>;

// ==================== PornMD Integration ====================

export interface PornMDIntegration {
  id: string;
  user_id: string;
  is_enabled: boolean;
  is_partner: boolean;
  partner_tier: "sponsor" | "premium" | "standard" | null;
  api_key_encrypted: string | null;
  api_secret_encrypted: string | null;
  content_preferences: JsonObject | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
  sync_count: number;
  created_at: string;
  updated_at: string;
}

export type PornMDPreferences = JsonObject;

// ==================== Multi-Camera Recording ====================

export interface MultiCameraSession {
  id: string;
  user_id: string;
  partner_id: string | null;
  session_name: string;
  session_type: "solo" | "partner_sync" | "multi_camera";
  recording_status: "draft" | "recording" | "paused" | "completed" | "editing" | "published";
  camera_count: number;
  sync_enabled: boolean;
  quality: "720p" | "1080p" | "2k" | "4k";
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  is_private: boolean;
  share_with_partner: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Intimate Date Proposals ====================

export interface IntimateDateProposal {
  id: string;
  creator_id: string;
  partner_id: string;
  proposal_title: string;
  proposal_type: "template" | "custom" | "quick";
  template_id: string | null;
  proposed_date: string;
  proposed_time: string;
  duration_minutes: number | null;
  location_name: string | null;
  location_address: string | null;
  location_type: "home" | "hotel" | "outdoor" | "other" | null;
  is_location_private: boolean;
  activities: JsonObject | null;
  specialty_intimacy: string[] | null;
  special_requests: string | null;
  voice_message_url: string | null;
  voice_message_duration_seconds: number | null;
  images_urls: string[] | null;
  gifs_urls: string[] | null;
  videos_urls: string[] | null;
  links: string[] | null;
  text_message: string | null;
  adult_emojis: string[] | null;
  proposal_status: "pending" | "reviewed" | "accepted" | "declined" | "modified" | "resubmitted";
  partner_response: string | null;
  partner_modified_date: string | null;
  partner_modified_time: string | null;
  partner_suggestions: string | null;
  partner_media_urls: string[] | null;
  reviewed_at: string | null;
  responded_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateIntimateDateProposalInput = {
  title: string;
  date: string;
  time: string;
  location?: string;
  locationAddress?: string;
  locationType?: IntimateDateProposal["location_type"];
  isLocationPrivate?: boolean;
  durationMinutes?: number;
  activities: JsonObject;
  positions?: string[];
  message?: string;
  specialRequests?: string;
  voiceMessageUrl?: string;
  images?: string[];
  gifs?: string[];
  videos?: string[];
  emojis?: string[];
  links?: string[];
};

export type ProposalResponse = "accepted" | "declined" | "modified";

export type ProposalModifications = {
  date?: string;
  time?: string;
  location?: string;
  suggestions?: string;
  media?: string[];
};

// ==================== Seductive AI Chat ====================

export interface SeductiveAISession {
  id: string;
  user_id: string;
  partner_id: string | null;
  session_name: string | null;
  session_type: "solo" | "partner" | "group";
  ai_personality: "seductive" | "flirty" | "dirty" | "nasty" | "romantic" | "kinky" | "custom";
  ai_intensity: "light" | "medium" | "strong" | "extreme";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SeductiveAIMessageMedia = {
  images?: string[];
  gifs?: string[];
  videos?: string[];
  voiceMessage?: string;
  emojis?: string[];
};

export type SeductiveAIMessageRow = {
  id: string;
  session_id: string;
  user_id: string;
  message_type: "user" | "ai";
  message_content: string;
  images_urls: string[] | null;
  gifs_urls: string[] | null;
  videos_urls: string[] | null;
  voice_message_url: string | null;
  adult_emojis: string[] | null;
  ai_confidence: number | null;
  ai_sentiment: string | null;
  ai_suggestions: string[] | null;
  context_data: JsonObject | null;
  created_at: string;
};

export type SeductiveAIResponse = {
  userMessage: SeductiveAIMessageRow;
  aiResponse: SeductiveAIMessageRow;
};

// ==================== Sex Positions Library ====================

export interface SexPosition {
  id: string;
  position_name: string;
  position_category: "basic" | "advanced" | "kinky" | "romantic" | "adventurous" | "acrobatic";
  difficulty_level: "easy" | "medium" | "hard" | "expert";
  description: string | null;
  instructions: string[] | null;
  tips: string[] | null;
  required_flexibility?: "none" | "some" | "moderate" | "high" | null;
  tags?: string[] | null;
  best_for?: string[] | null;
  image_url: string | null;
  video_url: string | null;
  gif_url: string | null;
  popularity_score: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}
