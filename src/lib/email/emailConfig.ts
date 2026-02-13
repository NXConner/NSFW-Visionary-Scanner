/**
 * Email Configuration
 *
 * This module handles email service configuration.
 * For Supabase projects, email is handled by Supabase Auth's built-in email service.
 * Custom SMTP settings can be configured in Supabase Dashboard > Authentication > Email Templates
 */

export interface EmailConfig {
  // App branding for email templates
  appName: string;
  appUrl: string;
  supportEmail: string;
  logoUrl: string;

  // Email service configuration
  useSupabaseEmail: boolean;

  // Optional custom SMTP (for edge functions)
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };
}

/**
 * Pre-verified email whitelist
 * These emails are treated as automatically verified and bypass email verification checks
 */
export const preVerifiedEmailWhitelist: string[] = ["n8ter8@gmail.com", "butterflii18@gmail.com"];

/**
 * Check if an email is in the pre-verified whitelist
 */
export function isEmailPreVerified(email: string | null | undefined): boolean {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return preVerifiedEmailWhitelist.includes(normalized);
}

// Get configuration from environment variables
export const emailConfig: EmailConfig = {
  appName: "MorphoScan Pro",
  appUrl:
    import.meta.env.VITE_APP_URL || (typeof window !== "undefined" ? window.location.origin : ""),
  supportEmail: import.meta.env.VITE_PRIVACY_CONTACT_EMAIL || "support@morphoscanpro.com",
  logoUrl: `${import.meta.env.VITE_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")}/logo.png`,

  // Use Supabase's built-in email service by default
  useSupabaseEmail: true,

  // SMTP config (only used if custom SMTP is needed via edge functions)
  smtp: import.meta.env.VITE_SMTP_HOST
    ? {
        host: import.meta.env.VITE_SMTP_HOST || "",
        port: parseInt(import.meta.env.VITE_SMTP_PORT || "587", 10),
        user: import.meta.env.VITE_SMTP_USER || "",
        pass: import.meta.env.VITE_SMTP_PASS || "",
        secure: import.meta.env.VITE_SMTP_SECURE === "true",
      }
    : undefined,
};

/**
 * Check if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  // Supabase email is always available if Supabase is configured
  return emailConfig.useSupabaseEmail || Boolean(emailConfig.smtp?.host);
}

/**
 * Get the email redirect URL for verification emails
 */
export function getEmailRedirectUrl(path: string = "/auth"): string {
  return `${emailConfig.appUrl}${path}`;
}
