export type JsonObject = Record<string, unknown>;

export interface MarketplaceCategory {
  id: string;
  category_name: string;
  category_description: string | null;
  category_type: string;
  icon_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceItem {
  id: string;
  creator_id: string;
  category_id: string | null;
  item_type: "routine" | "course" | "video" | "report_template" | "other";
  title: string;
  description: string;
  content_data: JsonObject;
  preview_content: JsonObject | null;
  preview_images: string[] | null;
  preview_video_url: string | null;
  thumbnail_url: string | null;
  price: number;
  currency: string;
  is_subscription: boolean;
  subscription_duration_days: number | null;
  is_free: boolean;
  tags: string[] | null;
  difficulty_level: string | null;
  target_audience: string[] | null;
  expert_name: string | null;
  expert_credentials: string | null;
  expert_bio: string | null;
  view_count: number;
  purchase_count: number;
  revenue_total: number;
  average_rating: number | null;
  rating_count: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_verified: boolean;
  is_trending: boolean;
  is_approved: boolean;
  moderation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplacePurchase {
  id: string;
  item_id: string;
  user_id: string;
  purchase_type: "one_time" | "subscription";
  price_paid: number;
  payment_intent_id: string | null;
  access_granted_at: string | null;
  access_expires_at: string | null;
  is_active: boolean;
  purchased_at: string;
}

export interface ExpertConsultation {
  id: string;
  expert_id: string;
  user_id: string;
  consultation_type: "one_time" | "follow_up" | "group_workshop";
  scheduled_at: string | null;
  duration_minutes: number;
  consultation_status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  price: number;
  currency: string;
  payment_status: "pending" | "paid" | "refunded";
  payment_intent_id: string | null;
  user_concerns: string | null;
  expert_notes: string | null;
  recommendations: string[] | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  recording_url: string | null;
  recording_available: boolean;
  user_rating: number | null;
  user_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomReport {
  id: string;
  user_id: string;
  report_type: "health_summary" | "progress_report" | "medical_export" | "custom";
  report_name: string;
  report_config: JsonObject;
  data_sources: string[];
  price: number;
  currency: string;
  payment_status: "pending" | "paid" | "refunded";
  payment_intent_id: string | null;
  generation_status: "pending" | "processing" | "completed" | "failed";
  generated_at: string | null;
  file_url: string | null;
  file_format: "pdf" | "excel" | "csv" | "json" | "hl7_fhir" | null;
  file_size_bytes: number | null;
  is_shared: boolean;
  shared_with: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentRecommendation {
  id: string;
  equipment_name: string;
  equipment_description: string;
  equipment_category: string | null;
  affiliate_url: string;
  affiliate_provider: string | null;
  commission_rate: number | null;
  price_range: string | null;
  rating: number | null;
  review_count: number;
  image_url: string | null;
  recommended_for: string[] | null;
  effectiveness_rating: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplementRecommendation {
  id: string;
  supplement_name: string;
  supplement_description: string;
  supplement_type: string | null;
  affiliate_url: string;
  affiliate_provider: string | null;
  commission_rate: number | null;
  price_range: string | null;
  rating: number | null;
  review_count: number;
  image_url: string | null;
  health_benefits: string[] | null;
  recommended_dosage: string | null;
  warnings: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}
