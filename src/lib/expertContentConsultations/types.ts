export interface ExpertProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  specialties: string[];
  credentials: string[] | null;
  years_experience: number | null;
  profile_image_url: string | null;
  availability_schedule: unknown | null;
  consultation_rate_per_hour: number;
  group_workshop_rate_per_person: number | null;
  currency: string;
  is_verified: boolean;
  is_available: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExpertArticle {
  id: string;
  expert_id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[] | null;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertVideo {
  id: string;
  expert_id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  description: string | null;
  duration_seconds: number | null;
  category: string | null;
  tags: string[] | null;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationBooking {
  id: string;
  expert_id: string;
  user_id: string;
  consultation_type: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  notes: string | null;
  meeting_url: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertQA {
  id: string;
  expert_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  category: string | null;
  status: string;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertRating {
  id: string;
  expert_id: string;
  user_id: string;
  consultation_id: string | null;
  rating: number;
  review_title: string | null;
  review_text: string | null;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupWorkshop {
  id: string;
  expert_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number | null;
  current_participants: number;
  price_per_person: number;
  status: string;
  meeting_url: string | null;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
}
