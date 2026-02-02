import type {
  DATE_NIGHT_SEGMENTS,
  INTIMACY_THEMES,
  PARTNER_AVAILABILITY_TAGS,
  PARTNER_BOUNDARY_TAGS,
  POSITION_PRIVACY_LEVELS,
  THOUGHT_PING_DELIVERY_STATES,
  THOUGHT_PING_PRIORITIES,
  THOUGHT_PING_INTENSITIES,
  THOUGHT_PING_TONE_TAGS,
} from "./constants";

export type PartnerConnectionStatus = "pending" | "accepted" | "declined" | "blocked";

export interface PartnerConnection {
  id: string;
  user_id: string;
  partner_id: string;
  status: PartnerConnectionStatus;
  invitation_code: string | null;
  invitation_expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ThoughtPingIntensity = (typeof THOUGHT_PING_INTENSITIES)[number];
export type ThoughtPingPriority = (typeof THOUGHT_PING_PRIORITIES)[number];
export type ThoughtPingDeliveryState = (typeof THOUGHT_PING_DELIVERY_STATES)[number];
export type ThoughtPingToneTag = (typeof THOUGHT_PING_TONE_TAGS)[number];
export type ThoughtPingStatus = "sent" | "read" | "archived" | "responded" | "scheduled";

export interface PartnerThoughtPing {
  id: string;
  connection_id: string;
  sender_id: string;
  recipient_id: string;
  tone_tags: string[];
  intensity: ThoughtPingIntensity;
  theme: string | null;
  priority: ThoughtPingPriority;
  is_pinned: boolean;
  delivery_state: ThoughtPingDeliveryState;
  scheduled_at: string | null;
  remind_at: string | null;
  read_receipt_requested: boolean;
  private_note_encrypted: string | null;
  images_urls: string[] | null;
  gifs_urls: string[] | null;
  voice_message_url: string | null;
  quick_reply_used: string | null;
  reaction_summary: Record<string, number> | null;
  message: string;
  detailed_message: string | null;
  status: ThoughtPingStatus;
  response_message: string | null;
  responded_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PositionSelectionStatus = "pending" | "accepted" | "declined" | "tried" | "archived";
export type PositionIntensity = ThoughtPingIntensity;

export interface PartnerPositionSelection {
  id: string;
  connection_id: string;
  position_id: string | null;
  custom_position_name: string | null;
  custom_description: string | null;
  suggested_by: string;
  suggested_for: string;
  selection_status: PositionSelectionStatus;
  theme_tags: string[];
  intensity: PositionIntensity;
  note: string | null;
  partner_note: string | null;
  responded_at: string | null;
  safety_checklist: string[] | null;
  constraints: Record<string, unknown> | null;
  availability_tags: string[] | null;
  boundary_tags: string[] | null;
  try_later: boolean;
  favorite_together: boolean;
  tried_at: string | null;
  success_notes: string | null;
  success_tags: string[] | null;
  swap_group_id: string | null;
  priority: ThoughtPingPriority;
  privacy_level: (typeof POSITION_PRIVACY_LEVELS)[number];
  rating: number | null;
  private_note_encrypted: string | null;
  created_at: string;
  updated_at: string;
  position_name?: string | null;
  position_description?: string | null;
}

export type DateNightSegment = (typeof DATE_NIGHT_SEGMENTS)[number];
export type DateNightTheme = (typeof INTIMACY_THEMES)[number];

export interface DateNightItineraryItem {
  id: string;
  segment: DateNightSegment;
  title: string;
  time: string;
  location: string;
  notes: string;
}

export interface DateNightChecklistItem {
  id: string;
  item: string;
  category: "prep" | "during" | "aftercare";
  isRequired: boolean;
}

export interface DateNightPackingItem {
  id: string;
  item: string;
}

export interface DateNightReminderItem {
  id: string;
  reminderType: "reservation" | "travel" | "checkin" | "custom";
  remindAt: string;
  notes: string;
}

export interface DateNightReflectionInput {
  rating: number;
  notes: string;
}

export interface DateNightPlanDetails {
  itinerary: DateNightItineraryItem[];
  checklist: DateNightChecklistItem[];
  packingList: DateNightPackingItem[];
  distractions: string[];
  positions: string[];
  aftercare: DateNightChecklistItem[];
  reminders: DateNightReminderItem[];
  reflections: Array<{ rating: number; notes: string; userId: string }>;
}

export interface DateNightPlanInput {
  partnerId: string;
  title: string;
  date: string;
  time: string;
  locationName: string;
  locationAddress: string;
  locationType: "home" | "hotel" | "outdoor" | "other";
  isLocationPrivate: boolean;
  durationMinutes: number | null;
  theme: DateNightTheme | "";
  distractionTags: string[];
  segments: DateNightSegment[];
  itinerary: DateNightItineraryItem[];
  positions: string[];
  message: string;
  specialRequests: string;
  voiceMessageUrl?: string;
  voiceMessageDurationSeconds?: number | null;
  images?: string[];
  gifs?: string[];
  videos?: string[];
  emojis?: string[];
  links?: string[];
  budget: number | null;
  travelMinutes: number | null;
  checklist: DateNightChecklistItem[];
  packingList: DateNightPackingItem[];
  aftercare: DateNightChecklistItem[];
  reminders: DateNightReminderItem[];
}

export type PartnerAvailabilityTag = (typeof PARTNER_AVAILABILITY_TAGS)[number];
export type PartnerBoundaryTag = (typeof PARTNER_BOUNDARY_TAGS)[number];

export interface PartnerSyncPreferences {
  user_id: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  rate_limit_per_hour: number;
  allow_push_notifications: boolean;
  allow_scheduled_pings: boolean;
  allow_media: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerSyncConsentRecord {
  id: string;
  connection_id: string;
  user_id: string;
  consent_version: string;
  accepted_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerSyncRetentionPolicy {
  id: string;
  connection_id: string;
  set_by: string;
  retention_days_pings: number;
  retention_days_selections: number;
  retention_days_plans: number;
  retention_days_events: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerSyncEvent {
  id: string;
  connection_id: string;
  actor_id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ThoughtPingTemplate {
  id: string;
  user_id: string;
  title: string;
  message: string;
  detailed_message: string | null;
  tone_tags: string[];
  intensity: ThoughtPingIntensity;
  theme: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuickReplyTemplate {
  id: string;
  user_id: string;
  label: string;
  message: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface DateNightTemplate {
  id: string;
  user_id: string | null;
  template_name: string;
  template_category: "romantic" | "passionate" | "adventurous" | "kinky" | "quick" | "custom" | null;
  is_public: boolean;
  default_activities: Record<string, unknown> | null;
  default_positions: string[] | null;
  default_duration_minutes: number | null;
  default_location_type: "home" | "hotel" | "outdoor" | "other" | null;
  default_message: string | null;
  default_voice_script: string | null;
  usage_count: number | null;
  created_at: string;
  updated_at: string;
}
