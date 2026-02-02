export type JsonObject = Record<string, unknown>;

export interface MobileWidgetConfiguration {
  id: string;
  user_id: string;
  widget_type:
    | "scanner_quick"
    | "health_summary"
    | "progress_tracker"
    | "routine_reminder"
    | "custom";
  widget_name: string;
  platform: "ios" | "android" | "both";
  widget_config: JsonObject;
  refresh_frequency_minutes: number;
  is_active: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppShortcut {
  id: string;
  user_id: string;
  shortcut_type: "scan" | "diary_entry" | "routine_start" | "quick_action" | "custom";
  shortcut_name: string;
  shortcut_icon: string | null;
  shortcut_action: JsonObject;
  platform: "ios" | "android" | "both";
  usage_count: number;
  last_used_at: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HapticFeedbackPreferences {
  id: string;
  user_id: string;
  haptic_enabled: boolean;
  haptic_intensity: "light" | "medium" | "strong";
  haptic_patterns: JsonObject;
  disable_on_low_battery: boolean;
  created_at: string;
  updated_at: string;
}

export interface WearableDevice {
  id: string;
  user_id: string;
  device_type: "apple_watch" | "wear_os" | "fitbit" | "other";
  device_name: string;
  device_model: string | null;
  device_identifier: string;
  is_connected: boolean;
  connection_status: "connected" | "disconnected" | "error";
  last_connected_at: string | null;
  last_sync_at: string | null;
  capabilities: JsonObject | null;
  auto_sync_enabled: boolean;
  sync_frequency_minutes: number;
  created_at: string;
  updated_at: string;
}
