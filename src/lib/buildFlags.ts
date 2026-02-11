/**
 * Build-time flags (compile-time constants via Vite env inlining).
 *
 * These are used to ensure store builds do NOT bundle NSFW routes/modules/strings at all.
 * Keep logic simple and purely based on `import.meta.env` so Rollup can dead-code-eliminate.
 *
 * Two distribution variants:
 * 1. SFW Store Build - For App Store/Play Store distribution (no adult content)
 * 2. NSFW Web Build - Direct web download with full adult content enabled
 */

export type AppVersion = "sfw" | "nsfw";
export type DistributionChannel = "store" | "direct";

export const BUILD_APP_VERSION = (import.meta.env.VITE_APP_VERSION || "nsfw") as
  | AppVersion
  | string;
export const BUILD_DISTRIBUTION_CHANNEL = (import.meta.env.VITE_DISTRIBUTION_CHANNEL ||
  "direct") as DistributionChannel | string;

/** True if this is a store build (App Store / Play Store) */
export const BUILD_IS_STORE = import.meta.env.VITE_DISTRIBUTION_CHANNEL === "store";

/** True if this is a direct web download build */
export const BUILD_IS_DIRECT = import.meta.env.VITE_DISTRIBUTION_CHANNEL !== "store";

/** True if this is the NSFW variant */
export const BUILD_IS_NSFW = (import.meta.env.VITE_APP_VERSION || "nsfw") === "nsfw";

/** True if this is the SFW variant */
export const BUILD_IS_SFW = (import.meta.env.VITE_APP_VERSION || "nsfw") === "sfw";

/**
 * Whether NSFW/adult surfaces should be present in the shipped bundle.
 *
 * - Store builds: never (regardless of version flag)
 * - Direct builds: only for nsfw version
 */
export const BUILD_ALLOW_ADULT_BUNDLE =
  import.meta.env.VITE_DISTRIBUTION_CHANNEL === "direct" &&
  ((import.meta.env.VITE_APP_VERSION || "nsfw") as string) === "nsfw";

/**
 * Build variant descriptor for analytics and debugging
 */
export const BUILD_VARIANT = BUILD_IS_STORE
  ? "store-sfw"
  : BUILD_IS_NSFW
    ? "direct-nsfw"
    : "direct-sfw";
