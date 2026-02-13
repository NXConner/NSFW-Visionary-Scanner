/**
 * Email Module
 *
 * Exports all email-related functionality
 */

export { EmailService, type EmailResult, type EmailTemplateType } from "./EmailService";
export {
  emailConfig,
  isEmailConfigured,
  getEmailRedirectUrl,
  type EmailConfig,
} from "./emailConfig";
export {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
  notificationEmailTemplate,
  partnerInviteEmailTemplate,
} from "./emailTemplates";
