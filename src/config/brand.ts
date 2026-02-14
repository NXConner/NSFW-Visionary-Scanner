export const APP_NAME = "MorphoScan Pro";

// Fallback only: set VITE_SUPPORT_CONTACT_EMAIL / VITE_PRIVACY_CONTACT_EMAIL in real environments.
export const DEFAULT_CONTACT_EMAIL = "support@yourdomain.invalid";

export const SUPPORT_CONTACT_EMAIL =
  (import.meta.env.VITE_SUPPORT_CONTACT_EMAIL as string | undefined) ??
  (import.meta.env.VITE_PRIVACY_CONTACT_EMAIL as string | undefined) ??
  DEFAULT_CONTACT_EMAIL;

export const PRIVACY_CONTACT_EMAIL =
  (import.meta.env.VITE_PRIVACY_CONTACT_EMAIL as string | undefined) ?? DEFAULT_CONTACT_EMAIL;

export const DPO_CONTACT_EMAIL =
  (import.meta.env.VITE_DPO_CONTACT_EMAIL as string | undefined) ??
  PRIVACY_CONTACT_EMAIL ??
  DEFAULT_CONTACT_EMAIL;

export function isLikelyEmail(value: string): boolean {
  // Keep deliberately permissive; validation is also enforced in app setup docs.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
