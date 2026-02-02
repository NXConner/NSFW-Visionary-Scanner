export interface HealthAppIntegration {
  id: string;
  user_id: string;
  integration_type:
    | "apple_health"
    | "google_fit"
    | "fitbit"
    | "myfitnesspal"
    | "nutrition_app"
    | "sleep_app"
    | "other";
  integration_name: string;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  api_key_encrypted: string | null;
  is_connected: boolean;
  connection_status: "connected" | "disconnected" | "error" | "expired";
  last_sync_at: string | null;
  last_sync_status: "success" | "partial" | "failed" | null;
  last_error: string | null;
  auto_sync_enabled: boolean;
  sync_frequency_minutes: number;
  sync_data_types: string[];
  permissions_granted: string[] | null;
  permissions_required: string[] | null;
  created_at: string;
  updated_at: string;
}
