/**
 * Expert Content & Consultations System
 * Handles expert profiles, articles, videos, Q&A, consultations, and bookings
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";
import { toast } from "sonner";

export interface ExpertProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  specialties: string[];
  credentials: string[];
  years_experience: number;
  rating: number;
  review_count: number;
  consultation_rate_per_hour: number;
  group_workshop_rate_per_person: number;
  is_verified: boolean;
  is_available: boolean;
  availability_schedule: any;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertArticle {
  id: string;
  expert_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  view_count: number;
  like_count: number;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertConsultation {
  id: string;
  expert_id: string;
  user_id: string;
  consultation_type: "individual" | "group";
  scheduled_at: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  payment_amount: number;
  meeting_url: string | null;
  recording_url: string | null;
  notes: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export async function getExpertProfiles(
  specialty?: string,
  minRating?: number,
): Promise<ExpertProfile[]> {
  try {
    let query = supabase
      .from("expert_profiles")
      .select("*")
      .eq("is_verified", true)
      .eq("is_available", true)
      .order("rating", { ascending: false });

    if (specialty) {
      query = query.contains("specialties", [specialty]);
    }

    if (minRating) {
      query = query.gte("rating", minRating);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching experts", { error: error.message });
      return [];
    }

    return (data || []) as ExpertProfile[];
  } catch (error) {
    logger.error("Error in getExpertProfiles", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function getExpertArticles(
  expertId?: string,
  category?: string,
): Promise<ExpertArticle[]> {
  try {
    let query = supabase
      .from("expert_articles")
      .select("*")
      .eq("published_at", null)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });

    if (expertId) {
      query = query.eq("expert_id", expertId);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching articles", { error: error.message });
      return [];
    }

    return (data || []) as ExpertArticle[];
  } catch (error) {
    logger.error("Error in getExpertArticles", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function bookConsultation(
  expertId: string,
  consultationType: "individual" | "group",
  scheduledAt: string,
  durationMinutes: number,
): Promise<ExpertConsultation | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to book consultation");
      return null;
    }

    // Get expert to get rates
    const { data: expert } = await supabase
      .from("expert_profiles")
      .select("consultation_rate_per_hour, group_workshop_rate_per_person")
      .eq("id", expertId)
      .single();

    if (!expert) {
      toast.error("Expert not found");
      return null;
    }

    const rate =
      consultationType === "individual"
        ? expert.consultation_rate_per_hour
        : expert.group_workshop_rate_per_person;

    const paymentAmount = (rate / 60) * durationMinutes;

    // Create consultation booking
    const { data, error } = await supabase
      .from("expert_consultations")
      .insert({
        expert_id: expertId,
        user_id: user.id,
        consultation_type: consultationType,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        payment_amount: paymentAmount,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (error) {
      logger.error("Error booking consultation", { error: error.message });
      toast.error("Failed to book consultation");
      return null;
    }

    // Create payment session
    const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          amount: paymentAmount,
          currency: "usd",
          metadata: {
            consultation_id: data.id,
            expert_id: expertId,
            type: consultationType,
          },
        },
      },
    );

    if (paymentError) {
      logger.error("Error creating payment", { error: paymentError.message });
    }

    toast.success("Consultation booked! Please complete payment.");
    return data as ExpertConsultation;
  } catch (error) {
    logger.error("Error in bookConsultation", {
      error: error instanceof Error ? error.message : String(error),
    });
    toast.error("Failed to book consultation");
    return null;
  }
}

export async function submitExpertQuestion(
  expertId: string,
  question: string,
  category?: string,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return false;
    }

    const { error } = await supabase.from("expert_questions").insert({
      expert_id: expertId,
      user_id: user.id,
      question,
      category,
      status: "pending",
    });

    if (error) {
      logger.error("Error submitting question", { error: error.message });
      toast.error("Failed to submit question");
      return false;
    }

    toast.success("Question submitted!");
    return true;
  } catch (error) {
    logger.error("Error in submitExpertQuestion", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function rateExpert(
  consultationId: string,
  rating: number,
  review?: string,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return false;
    }

    const { error } = await supabase
      .from("expert_consultations")
      .update({
        rating,
        review,
      })
      .eq("id", consultationId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error rating expert", { error: error.message });
      toast.error("Failed to submit rating");
      return false;
    }

    // Update expert's average rating
    const { data: consultation } = await supabase
      .from("expert_consultations")
      .select("expert_id, rating")
      .eq("expert_id", consultationId)
      .not("rating", "is", null);

    if (consultation) {
      const avgRating =
        consultation.reduce((sum, c) => sum + (c.rating || 0), 0) / consultation.length;
      await supabase
        .from("expert_profiles")
        .update({
          rating: avgRating,
          review_count: consultation.length,
        })
        .eq("id", consultation[0].expert_id);
    }

    toast.success("Rating submitted!");
    return true;
  } catch (error) {
    logger.error("Error in rateExpert", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
