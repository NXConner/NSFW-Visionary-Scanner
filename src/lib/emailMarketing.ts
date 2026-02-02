/**
 * Email Marketing System (Supabase-backed + provider via Edge Function)
 *
 * Backed by:
 * - supabase/migrations/20251214194000_email_marketing.sql
 *
 * Sending is performed via:
 * - supabase/functions/send-email (admin-only)
 */

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  segment: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused";
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: "welcome" | "onboarding" | "engagement" | "retention" | "promotional" | "transactional";
  variables: string[];
  created_at: string;
}

export interface EmailSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  user_count: number;
  created_at: string;
}

/**
 * Initialize email service
 */
export async function initializeEmailService(): Promise<boolean> {
  // Client cannot verify server-side provider env vars; consider this initialized if auth works.
  try {
    const { data } = await supabase.auth.getUser();
    return Boolean(data.user);
  } catch {
    return false;
  }
}

/**
 * Send email via service
 */
export async function sendEmail(
  to: string,
  subject: string,
  content: string,
  templateId?: string,
): Promise<boolean> {
  try {
    const t = String(to || "").trim();
    const s = String(subject || "").trim();
    let c = String(content || "");

    if (!t || !s || !c) {
      toast.error("Missing to/subject/content");
      return false;
    }

    if (templateId) {
      const { data: tpl, error: tplErr } = await fromExtended("email_templates")
        .select("*")
        .eq("id", templateId)
        .maybeSingle();
      if (!tplErr && tpl?.content) c = String(tpl.content);
    }

    const { error } = await supabase.functions.invoke("send-email", {
      body: { to: t, subject: s, content: c },
    });

    if (error) {
      toast.error(error.message || "Failed to send email");
      return false;
    }
    toast.success("Email sent");
    return true;
  } catch (error) {
    logger.error("sendEmail error", { error });
    toast.error("Failed to send email");
    return false;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(userEmail: string, userName?: string): Promise<boolean> {
  try {
    // Prefer a template if available

    const { data: tpl } = await fromExtended("email_templates")
      .select("*")
      .eq("category", "welcome")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1);

    const template = Array.isArray(tpl) ? tpl[0] : null;
    if (!template) {
      toast.error("No welcome email template configured");
      return false;
    }

    const content = String(template.content || "")
      .replace(/\{\{name\}\}/g, userName || "")
      .replace(/\{\{email\}\}/g, userEmail);

    return await sendEmail(
      userEmail,
      String(template.subject || "Welcome"),
      content,
      String(template.id),
    );
  } catch {
    return false;
  }
}

/**
 * Send onboarding email sequence
 */
export async function sendOnboardingEmail(day: number, userEmail: string): Promise<boolean> {
  const d = Math.max(1, Math.min(30, Number(day)));

  const { data: tpl } = await fromExtended("email_templates")
    .select("*")
    .eq("category", "onboarding")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1);

  const template = Array.isArray(tpl) ? tpl[0] : null;
  if (!template) {
    toast.error("No onboarding email template configured");
    return false;
  }

  const content = String(template.content || "")
    .replace(/\{\{day\}\}/g, String(d))
    .replace(/\{\{email\}\}/g, userEmail);
  return await sendEmail(
    userEmail,
    String(template.subject || `Onboarding Day ${d}`),
    content,
    String(template.id),
  );
}

/**
 * Send re-engagement email
 */
export async function sendReEngagementEmail(
  userEmail: string,
  daysInactive: number,
): Promise<boolean> {
  const days = Math.max(1, Math.min(365, Number(daysInactive)));

  const { data: tpl } = await fromExtended("email_templates")
    .select("*")
    .eq("category", "retention")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1);

  const template = Array.isArray(tpl) ? tpl[0] : null;
  if (!template) {
    toast.error("No retention email template configured");
    return false;
  }

  const content = String(template.content || "")
    .replace(/\{\{days_inactive\}\}/g, String(days))
    .replace(/\{\{email\}\}/g, userEmail);
  return await sendEmail(
    userEmail,
    String(template.subject || "We miss you"),
    content,
    String(template.id),
  );
}

/**
 * Send upgrade prompt email
 */
export async function sendUpgradeEmail(
  userEmail: string,
  currentTier: string,
  targetTier: string,
): Promise<boolean> {
  const { data: tpl } = await fromExtended("email_templates")
    .select("*")
    .eq("category", "promotional")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1);

  const template = Array.isArray(tpl) ? tpl[0] : null;
  if (!template) {
    toast.error("No promotional email template configured");
    return false;
  }

  const content = String(template.content || "")
    .replace(/\{\{current_tier\}\}/g, currentTier)
    .replace(/\{\{target_tier\}\}/g, targetTier)
    .replace(/\{\{email\}\}/g, userEmail);

  return await sendEmail(
    userEmail,
    String(template.subject || "Upgrade available"),
    content,
    String(template.id),
  );
}

/**
 * Get email analytics
 */
export async function getEmailAnalytics(): Promise<{
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
} | null> {
  try {
    const { data: sent, error } = await fromExtended("email_send_events")
      .select("status", { count: "exact", head: true });

    if (error) return null;

    // We only store sent/failed currently; open/click tracking requires provider webhooks.
    const total_sent = Number(sent?.count ?? 0);
    return {
      total_sent,
      total_opened: 0,
      total_clicked: 0,
      open_rate: 0,
      click_rate: 0,
    };
  } catch {
    return null;
  }
}
