export interface APIKey {
  id: string;
  user_id: string;
  key_name: string;
  api_key_hash: string;
  api_key_prefix: string;
  access_tier: "basic" | "pro" | "enterprise";
  rate_limit_per_minute: number;
  is_active: boolean;
  created_at: string;
}

export interface Webhook {
  id: string;
  user_id: string;
  webhook_name: string;
  webhook_url: string;
  webhook_secret: string;
  subscribed_events: string[];
  is_active: boolean;
  created_at: string;
}
