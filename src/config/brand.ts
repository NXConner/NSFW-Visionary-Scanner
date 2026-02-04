export const APP_SUITE_NAME = "Visionary Scanner Suite";
export const APP_SUITE_SHORT_NAME = "Visionary Scanner";
export const APP_SFW_NAME = "MorphoScan Pro";
export const APP_SFW_SHORT_NAME = "MorphoScan";
export const APP_NSFW_NAME = "NSFW Visionary Scanner";
export const APP_NSFW_SHORT_NAME = "NSFW Visionary";

const appVersion = (import.meta.env.VITE_APP_VERSION || "nsfw").toLowerCase();
const distributionChannel = (import.meta.env.VITE_DISTRIBUTION_CHANNEL || "direct").toLowerCase();
const isStore = distributionChannel === "store";
const isHybrid = appVersion === "hybrid";
const isNsfw = appVersion === "nsfw" && !isStore;

export const APP_NAME = isHybrid ? APP_SUITE_NAME : isNsfw ? APP_NSFW_NAME : APP_SFW_NAME;
export const APP_SHORT_NAME = isHybrid
  ? APP_SUITE_SHORT_NAME
  : isNsfw
    ? APP_NSFW_SHORT_NAME
    : APP_SFW_SHORT_NAME;
export const APP_TAGLINE = isHybrid
  ? "Health & Wellness"
  : isNsfw
    ? "Adult Wellness"
    : "Men's Health";
export const APP_NAMESPACE = APP_SHORT_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-");
export const APP_ICS_PROD_ID = APP_SHORT_NAME.replace(/[^A-Za-z0-9]+/g, "");
export const APP_FHIR_ORG_ID = `org-${APP_NAMESPACE}`;
export const APP_FHIR_ORG_NAME = `${APP_SHORT_NAME} Self-Assessment`;
export const APP_REPORT_TITLE = `${APP_SHORT_NAME} Health Report`;

export const DEFAULT_CONTACT_EMAIL = "n8ter8@gmail.com";

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
