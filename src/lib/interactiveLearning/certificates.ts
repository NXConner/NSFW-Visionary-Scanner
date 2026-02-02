import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { LearningCertificate } from "./types";

export async function getUserCertificates(): Promise<LearningCertificate[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("learning_certificates")
      .select(
        `
        *,
        course:learning_courses(*)
      `,
      )
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (error) throw error;
    return (data || []) as LearningCertificate[];
  } catch (error) {
    logger.error("Failed to fetch certificates", { error });
    return [];
  }
}

export async function getCertificates(): Promise<LearningCertificate[]> {
  return getUserCertificates();
}

export async function issueCertificate(courseId: string): Promise<LearningCertificate | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: existing } = await supabase
      .from("learning_certificates")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existing) return existing as LearningCertificate;

    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data, error } = await supabase
      .from("learning_certificates")
      .insert({
        user_id: user.id,
        course_id: courseId,
        certificate_number: certificateNumber,
        issued_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    toast.success("Certificate issued! 🎓");
    return data as LearningCertificate;
  } catch (error) {
    logger.error("Failed to issue certificate", { error });
    toast.error("Failed to issue certificate");
    return null;
  }
}
