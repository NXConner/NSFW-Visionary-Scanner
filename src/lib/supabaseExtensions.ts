/**
 * Supabase Extensions for Tables Not Yet in Generated Types
 *
 * This module provides type-safe wrappers for database tables that may not yet
 * be present in the auto-generated Supabase types. Use these helpers instead of
 * `(supabase as any)` casts throughout the codebase.
 *
 * Once tables are added to the schema and types regenerated, these helpers
 * can be replaced with direct supabase.from() calls.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Extended table names that exist in the database but may not be in generated types
 */
export type ExtendedTableName =
  | "active_sessions"
  | "intimate_date_proposals"
  | "video_playlists"
  | "playlist_videos"
  | "nsfw_sexual_function_tracking"
  | "nsfw_libido_tracking"
  | "nsfw_satisfaction_tracking"
  | "nsfw_frequency_tracking"
  | "nsfw_wellness_scores"
  | "user_privacy_settings"
  | "subscription_tiers"
  | "user_subscriptions"
  | "tier_comparison_features"
  | "workshop_bookings"
  | "workshop_participants"
  | "sexual_health_education_modules"
  | "user_position_media_overrides"
  | "nsfw_positions_gallery"
  | "education_interactive_content"
  | "education_user_progress"
  | "education_qa"
  | "education_qa_interactions"
  | "education_expert_content"
  | "education_research_updates"
  | "education_bookmarks"
  | "video_bookmarks"
  | "video_ratings"
  | "video_library"
  | "nsfw_positions_favorites"
  | "nsfw_video_downloads"
  | "nsfw_video_watch_history"
  | "nsfw_video_bookmarks"
  | "nsfw_consent_policies"
  | "nsfw_consent_events"
  | "user_roles"
  | "multi_camera_sessions"
  | "camera_streams"
  | "video_recordings"
  | "video_edits"
  | "expert_articles"
  | "dlc_wishlist_packages"
  | "nsfw_video_content"
  | "nsfw_video_playlists"
  | "nsfw_video_progress"
  | "expert_ratings"
  | "consultation_bookings"
  | "growth_predictions"
  | "health_risk_predictions"
  | "routine_timing_predictions"
  | "outcome_simulations"
  | "sexual_wellness_scores"
  | "nsfw_topics"
  | "nsfw_topic_library_items"
  | "expert_profiles"
  // Health monitoring tables
  | "prostate_health"
  | "testicular_health"
  | "sexual_health_metrics"
  | "hormone_levels"
  | "urinary_health"
  | "health_alerts"
  | "health_risk_factors"
  // API & webhooks
  | "api_keys"
  | "webhooks"
  // Export/Import
  | "export_jobs"
  | "import_jobs"
  | "cloud_service_connections"
  // Referral system
  | "referral_codes"
  | "referral_tracking"
  | "referral_rewards"
  // Support system
  | "support_tickets"
  | "support_ticket_messages"
  // Predictive modeling
  | "predictive_models"
  | "long_term_health_forecasts"
  // In-app messaging
  | "expert_consultations"
  | "group_chats"
  | "group_chat_members"
  | "group_chat_messages"
  | "direct_messages"
  // Enhanced diary features
  | "enhanced_diary_entries"
  | "diary_search_index"
  | "diary_templates"
  | "medication_schedules"
  | "medication_log"
  | "diary_analytics"
  // Security & privacy
  | "privacy_controls"
  | "login_history"
  // Video screenshots
  | "video_screenshots"
  // DLC & NSFW tables
  | "dlc_packages"
  | "dlc_promo_codes"
  | "dlc_promo_redemptions"
  | "dlc_promo_code_usage"
  | "nsfw_forum_threads"
  | "nsfw_forum_posts"
  | "nsfw_detection_models"
  | "nsfw_detection_results"
  | "nsfw_ensemble_results"
  // Scanner features
  | "scans"
  // Advanced scanner features
  | "multi_angle_scan_sessions"
  | "multi_angle_scan_images"
  | "cloud_processing_jobs"
  | "time_lapse_comparisons"
  | "measurement_templates"
  | "batch_scan_sessions"
  | "exported_3d_models"
  // NSFW community
  | "nsfw_support_groups"
  | "nsfw_support_group_members"
  | "nsfw_community_challenges"
  | "nsfw_challenge_participants"
  // Sexual wellness
  | "sexual_wellness_entries"
  | "sexual_wellness_goals"
  | "sexual_wellness_patterns"
  | "partner_connections"
  | "partner_data_permissions"
  | "partner_thought_pings"
  | "partner_thought_ping_reactions"
  | "partner_thought_ping_templates"
  | "partner_quick_reply_templates"
  | "partner_sync_preferences"
  | "partner_sync_consent"
  | "partner_sync_events"
  | "partner_sync_audit_log"
  | "partner_sync_abuse_signals"
  | "partner_sync_retention_policies"
  | "partner_position_selections"
  | "partner_position_activity_log"
  // AI conversation
  | "ai_conversation_sessions"
  | "ai_conversation_messages"
  | "ai_contextual_memory"
  | "ai_proactive_suggestions"
  // Email marketing
  | "email_templates"
  | "email_send_events"
  // Two factor auth
  | "two_factor_authentication"
  // Video playlists (already have video_playlists, adding playlist_videos)
  | "support_chat_sessions"
  | "support_chat_messages"
  | "support_chat_quick_responses"
  // Expert Q&A
  | "expert_qa"
  // Security
  | "security_alerts"
  // Video progress
  | "video_progress"
  // Provider reports
  | "provider_reports"
  // NSFW features
  | "pornmd_integration"
  | "seductive_ai_messages"
  // Video downloads
  | "video_downloads"
  // Interactive learning
  | "learning_course_reviews"
  | "learning_courses"
  | "learning_lessons"
  // Health education
  | "health_education_content"
  | "health_assessments"
  | "user_assessment_results"
  | "self_examination_guides"
  | "screening_reminders"
  // Progress sharing
  | "progress_shares"
  | "progress_share_interactions"
  | "challenges"
  | "challenge_participants"
  | "challenge_checkins"
  | "leaderboards"
  | "leaderboard_entries"
  // Premium add-ons
  | "premium_add_ons"
  | "user_add_ons"
  // Adaptive routines
  | "adaptive_routines"
  | "routine_templates"
  | "routine_analytics"
  | "shared_routines"
  | "routine_marketplace"
  | "rest_day_recommendations"
  | "multi_week_programs"
  // Premium content
  | "premium_content_items"
  | "premium_content_purchases"
  | "premium_content_reviews"
  | "premium_content_wishlist"
  // Marketplace
  | "marketplace_items"
  | "marketplace_purchases"
  // Expert videos
  | "expert_videos"
  // Date plan items
  | "intimate_date_itinerary_items"
  | "intimate_date_checklist_items"
  | "intimate_date_packing_items"
  | "intimate_date_distractions"
  | "intimate_date_positions"
  | "intimate_date_reminders"
  | "intimate_date_aftercare_items"
  | "intimate_date_reflections"
  | "intimate_date_templates";

/**
 * Get a query builder for extended tables that aren't in generated types.
 * This provides a controlled escape hatch instead of scattering `as any` throughout the codebase.
 * 
 * @param tableName - Name of the extended table
 * @returns Query builder for the specified table
 * 
 * @example
 * const { data } = await fromExtended("active_sessions")
 *   .select("*")
 *   .eq("user_id", userId);
 */
export function fromExtended(tableName: ExtendedTableName) {
  // Controlled type assertion for known extended tables only
  // This centralizes the `as any` pattern to a single location
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(tableName);
}

/**
 * Type definitions for extended tables (partial, add more fields as needed)
 */

export interface ActiveSession {
  id?: string;
  user_id: string;
  device_name?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  is_active: boolean;
  created_at?: string;
  last_active_at?: string;
  revoked_at?: string | null;
}

export interface IntimateDateProposal {
  id?: string;
  user_id: string;
  partner_id?: string | null;
  proposed_date: string;
  activity_type: string;
  location?: string | null;
  notes?: string | null;
  status: "pending" | "accepted" | "declined";
  created_at?: string;
}

export interface VideoPlaylist {
  id?: string;
  user_id: string;
  playlist_name: string;
  description?: string | null;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlaylistVideo {
  id?: string;
  playlist_id: string;
  video_id: string;
  order_index: number;
  added_at?: string;
}

export interface NsfwWellnessScore {
  id?: string;
  user_id: string;
  score_date: string;
  overall_score: number;
  dimensions?: Record<string, number>;
  notes?: string | null;
  created_at?: string;
}
