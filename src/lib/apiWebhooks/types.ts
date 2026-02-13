export interface APIKey {
  id: string;
  user_id: string;
  key_name: string;
  api_key_hash: string;
  api_key_prefix: string;
  access_tier: "basic" | "pro" | "enterprise";
  rate_limit_per_minute: number;
  rate_limit_per_hour?: number | null;
  rate_limit_per_day?: number | null;
  allowed_endpoints?: string[] | null;
  allowed_methods?: string[] | null;
  is_active: boolean;
  expires_at?: string | null;
  last_used_at?: string | null;
  total_requests?: number | null;
  last_request_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Webhook {
  id: string;
  user_id: string;
  webhook_name: string;
  webhook_url: string;
  webhook_secret: string | null;
  subscribed_events: string[];
  is_active: boolean;
  is_verified?: boolean | null;
  verification_token?: string | null;
  max_retries?: number | null;
  retry_delay_seconds?: number | null;
  total_deliveries?: number | null;
  successful_deliveries?: number | null;
  failed_deliveries?: number | null;
  last_delivery_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export type WebhookDeliveryStatus = "pending" | "delivered" | "failed" | "retrying";

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  payload: Record<string, unknown>;
  delivery_status: WebhookDeliveryStatus;
  http_status_code: number | null;
  response_body: string | null;
  retry_count: number | null;
  next_retry_at: string | null;
  attempted_at: string;
  delivered_at: string | null;
  failed_at: string | null;
}
