/**
 * Centralized URLs + route paths.
 *
 * Notes:
 * - Avoid real domains in user-facing placeholders (copy/paste accidents).
 * - Keep this file free of secrets; it is bundled client-side.
 */
import { SUPPORT_CONTACT_EMAIL, PRIVACY_CONTACT_EMAIL, DPO_CONTACT_EMAIL } from "@/config/brand";

export const APP_ROUTES = {
  privacy: "/privacy",
  terms: "/terms",
  credits: "/credits",
} as const;

function readViteEnv(key: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaEnv = ((import.meta as any)?.env as Record<string, unknown> | undefined) ?? undefined;
  const v = metaEnv?.[key];
  return typeof v === "string" ? v : undefined;
}

function safeOriginFromUrl(input: string | undefined): string | null {
  if (!input) return null;
  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
}

function runtimeOrigin(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const origin = window.location?.origin;
    return typeof origin === "string" && origin.length > 0 ? origin : null;
  } catch {
    return null;
  }
}

/**
 * Best-effort app origin used for generating absolute legal/support URLs in emails.
 * Prefer `VITE_APP_URL` when set; otherwise fall back to runtime `window.location.origin`.
 */
export const APP_ORIGIN: string =
  safeOriginFromUrl(readViteEnv("VITE_APP_URL")) ?? runtimeOrigin() ?? "http://localhost:8080";

export const LEGAL_URLS = {
  privacy: new URL(APP_ROUTES.privacy, APP_ORIGIN).toString(),
  terms: new URL(APP_ROUTES.terms, APP_ORIGIN).toString(),
  credits: new URL(APP_ROUTES.credits, APP_ORIGIN).toString(),
} as const;

export const CONTACT_LINKS = {
  supportMailto: `mailto:${SUPPORT_CONTACT_EMAIL}`,
  privacyMailto: `mailto:${PRIVACY_CONTACT_EMAIL}`,
  dpoMailto: `mailto:${DPO_CONTACT_EMAIL}`,
} as const;
