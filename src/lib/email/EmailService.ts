/**
 * Email Service
 * 
 * Main email service that handles sending various types of transactional emails.
 * Uses Supabase Auth for verification emails and can be extended for custom emails.
 */

import { supabase } from '@/integrations/supabase/client';
import { emailConfig, getEmailRedirectUrl } from './emailConfig';
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
  notificationEmailTemplate,
  partnerInviteEmailTemplate,
} from './emailTemplates';
import { logger } from '@/lib/logger';

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export interface EmailLogEntry {
  id: string;
  type: 'verification' | 'password_reset' | 'welcome' | 'notification' | 'partner_invite';
  recipientEmail: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: Date;
  error?: string;
}

// In-memory email log (in production, this would be stored in database)
const emailLog: EmailLogEntry[] = [];

/**
 * Generate a unique ID for email log entries
 */
function generateEmailId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log an email event
 */
function logEmail(entry: Omit<EmailLogEntry, 'id' | 'sentAt'>): EmailLogEntry {
  const logEntry: EmailLogEntry = {
    ...entry,
    id: generateEmailId(),
    sentAt: new Date(),
  };
  emailLog.unshift(logEntry);
  // Keep only last 100 entries in memory
  if (emailLog.length > 100) {
    emailLog.pop();
  }
  return logEntry;
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
      const redirectUrl = getEmailRedirectUrl('/auth?verified=true');
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        logEmail({
          type: 'verification',
          recipientEmail: email,
          subject: 'Email Verification Required',
          status: 'failed',
          error: error.message,
        });
        logger.error('Failed to send verification email', { email, error: error.message });
        return { success: false, error: error.message };
      }

      const logEntry = logEmail({
        type: 'verification',
        recipientEmail: email,
        subject: 'Email Verification Required',
        status: 'sent',
      });

      logger.info('Verification email sent', { email });
      return { success: true, messageId: logEntry.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logEmail({
        type: 'verification',
        recipientEmail: email,
        subject: 'Email Verification Required',
        status: 'failed',
        error: errorMessage,
      });
      logger.error('Exception sending verification email', { email, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Send password reset email using Supabase Auth
   */
  async sendPasswordResetEmail(email: string): Promise<EmailResult> {
    try {
      const redirectUrl = getEmailRedirectUrl('/auth?reset=true');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        logEmail({
          type: 'password_reset',
          recipientEmail: email,
          subject: 'Reset Your Password',
          status: 'failed',
          error: error.message,
        });
        logger.error('Failed to send password reset email', { email, error: error.message });
        return { success: false, error: error.message };
      }

      const logEntry = logEmail({
        type: 'password_reset',
        recipientEmail: email,
        subject: 'Reset Your Password',
        status: 'sent',
      });

      logger.info('Password reset email sent', { email });
      return { success: true, messageId: logEntry.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logEmail({
        type: 'password_reset',
        recipientEmail: email,
        subject: 'Reset Your Password',
        status: 'failed',
        error: errorMessage,
      });
      logger.error('Exception sending password reset email', { email, error: errorMessage });
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
      // Generate template for logging/preview purposes
      const _template = welcomeEmailTemplate(userName);
      
      // In production, this would call a Supabase Edge Function or external API
      // For now, we log it and return success (Supabase handles welcome in verification flow)
      const logEntry = logEmail({
        type: 'welcome',
        recipientEmail: email,
        subject: `Welcome to ${emailConfig.appName}!`,
        status: 'sent',
      });

      logger.info('Welcome email logged', { email, userName });
      return { success: true, messageId: logEntry.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logEmail({
        type: 'welcome',
        recipientEmail: email,
        subject: `Welcome to ${emailConfig.appName}!`,
        status: 'failed',
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Send notification email
   */
  async sendNotificationEmail(email: string, subject: string, content: string): Promise<EmailResult> {
    try {
      const _template = notificationEmailTemplate(subject, content);
      
      // In production, this would use an email service
      const logEntry = logEmail({
        type: 'notification',
        recipientEmail: email,
        subject,
        status: 'sent',
      });

      logger.info('Notification email logged', { email, subject });
      return { success: true, messageId: logEntry.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logEmail({
        type: 'notification',
        recipientEmail: email,
        subject,
        status: 'failed',
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Send partner invite email
   */
  async sendPartnerInviteEmail(email: string, inviterName: string, inviteLink: string): Promise<EmailResult> {
    try {
      const _template = partnerInviteEmailTemplate(inviterName, inviteLink);
      
      // In production, this would use an email service
      const logEntry = logEmail({
        type: 'partner_invite',
        recipientEmail: email,
        subject: `${inviterName} invited you to ${emailConfig.appName}`,
        status: 'sent',
      });

      logger.info('Partner invite email logged', { email, inviterName });
      return { success: true, messageId: logEntry.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logEmail({
        type: 'partner_invite',
        recipientEmail: email,
        subject: `${inviterName} invited you to ${emailConfig.appName}`,
        status: 'failed',
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Get email log entries
   */
  getEmailLog(limit: number = 50): EmailLogEntry[] {
    return emailLog.slice(0, limit);
  },

  /**
   * Get email log by recipient
   */
  getEmailLogByRecipient(email: string): EmailLogEntry[] {
    return emailLog.filter(entry => entry.recipientEmail === email);
  },

  /**
   * Check if user's email is verified
   */
  async checkEmailVerificationStatus(userId?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Check if this is the user we're looking for (or current user)
      if (userId && user.id !== userId) return false;
      
      return user.email_confirmed_at !== null;
    } catch {
      return false;
    }
  },

  /**
   * Get email templates for preview
   */
  getTemplatePreview(type: EmailLogEntry['type']): string {
    const sampleLink = `${emailConfig.appUrl}/sample-link`;
    
    switch (type) {
      case 'verification':
        return verificationEmailTemplate(sampleLink);
      case 'password_reset':
        return passwordResetEmailTemplate(sampleLink);
      case 'welcome':
        return welcomeEmailTemplate('User');
      case 'notification':
        return notificationEmailTemplate('Sample Notification', '<p>This is a sample notification content.</p>');
      case 'partner_invite':
        return partnerInviteEmailTemplate('Partner Name', sampleLink);
      default:
        return '';
    }
  },
};

export default EmailService;
