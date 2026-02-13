/**
 * Email Service
 *
 * Main email service that handles sending various types of transactional emails.
 * Uses Supabase Auth for verification emails and can be extended for custom emails.
 */

import { supabase } from "@/integrations/supabase/client";
import { emailConfig, getEmailRedirectUrl, isEmailPreVerified } from "./emailConfig";
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
  notificationEmailTemplate,
  partnerInviteEmailTemplate,
} from "./emailTemplates";
import { logger } from "@/lib/logger";

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export type EmailTemplateType =
  | "verification"
  | "password_reset"
  | "welcome"
  | "notification"
  | "partner_invite";

async function sendEmailViaEdge(params: {
  to: string;
  subject: string;
  html: string;
  campaignId?: string;
}): Promise<EmailResult> {
  const to = String(params.to || "").trim();
  const subject = String(params.subject || "").trim();
  const html = String(params.html || "");
  const campaignId = params.campaignId ? String(params.campaignId) : undefined;

  if (!to || !subject || !html) {
    return { success: false, error: "Missing to/subject/content" };
  }

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, content: html, campaignId },
    });

    if (error) {
      return { success: false, error: error.message || "Failed to send email" };
    }

    const providerId = (data as any)?.id ? String((data as any).id) : undefined;
    return { success: true, messageId: providerId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Email Service class with methods for sending various email types
 */
export const EmailService = {
  /**
   * Send verification email using Supabase Auth
   * This leverages Supabase's built-in email verification system
   */
  async sendVerificationEmail(email: string): Promise<EmailResult> {
    try {
      const redirectUrl = getEmailRedirectUrl("/auth?verified=true");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        logger.error("Failed to send verification email", { email, error: error.message });
        return { success: false, error: error.message };
      }

      logger.info("Verification email sent", { email });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error("Exception sending verification email", { email, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Send password reset email using Supabase Auth
   */
  async sendPasswordResetEmail(email: string): Promise<EmailResult> {
    try {
      const redirectUrl = getEmailRedirectUrl("/auth?reset=true");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        logger.error("Failed to send password reset email", { email, error: error.message });
        return { success: false, error: error.message };
      }

      logger.info("Password reset email sent", { email });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error("Exception sending password reset email", { email, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Send welcome email
   * Note: In a full implementation, this would use a Supabase Edge Function
   * or external email service (SendGrid, Resend, etc.)
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<EmailResult> {
    try {
      const html = welcomeEmailTemplate(userName);
      const subject = `Welcome to ${emailConfig.appName}!`;
      const result = await sendEmailViaEdge({ to: email, subject, html });
      if (result.success) {
        logger.info("Welcome email sent", { email });
      } else {
        logger.warn("Welcome email failed", { email, error: result.error });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Send notification email
   */
  async sendNotificationEmail(
    email: string,
    subject: string,
    content: string,
  ): Promise<EmailResult> {
    try {
      const html = notificationEmailTemplate(subject, content);
      const result = await sendEmailViaEdge({ to: email, subject, html });
      if (result.success) {
        logger.info("Notification email sent", { email, subject });
      } else {
        logger.warn("Notification email failed", { email, subject, error: result.error });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Send partner invite email
   */
  async sendPartnerInviteEmail(
    email: string,
    inviterName: string,
    inviteLink: string,
  ): Promise<EmailResult> {
    try {
      const subject = `${inviterName} invited you to ${emailConfig.appName}`;
      const html = partnerInviteEmailTemplate(inviterName, inviteLink);
      const result = await sendEmailViaEdge({ to: email, subject, html });
      if (result.success) {
        logger.info("Partner invite email sent", { email });
      } else {
        logger.warn("Partner invite email failed", { email, error: result.error });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Check if user's email is verified
   * Returns true if:
   * 1. Email is in the pre-verified whitelist, OR
   * 2. Email has been confirmed via Supabase Auth
   */
  async checkEmailVerificationStatus(userId?: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if this is the user we're looking for (or current user)
      if (userId && user.id !== userId) return false;

      // Check if email is in the pre-verified whitelist
      if (isEmailPreVerified(user.email)) {
        return true;
      }

      return user.email_confirmed_at !== null;
    } catch {
      return false;
    }
  },

  /**
   * Get email templates for preview
   */
  getTemplatePreview(type: EmailTemplateType): string {
    const sampleLink = `${emailConfig.appUrl}/sample-link`;

    switch (type) {
      case "verification":
        return verificationEmailTemplate(sampleLink);
      case "password_reset":
        return passwordResetEmailTemplate(sampleLink);
      case "welcome":
        return welcomeEmailTemplate("User");
      case "notification":
        return notificationEmailTemplate(
          "Sample Notification",
          "<p>This is a sample notification content.</p>",
        );
      case "partner_invite":
        return partnerInviteEmailTemplate("Partner Name", sampleLink);
      default:
        return "";
    }
  },
};

export default EmailService;
