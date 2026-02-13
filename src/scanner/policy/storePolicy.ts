import { BUILD_IS_STORE, BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";

/**
 * Scanner-specific policy decisions that must remain tree-shakeable.
 * Keep this module pure and dependent only on build-time flags where possible.
 */

export function isStoreBuild(): boolean {
  return BUILD_IS_STORE;
}

/**
 * Store builds must never ship adult/NSFW surfaces (strings/routes/modules).
 * This should remain false in store distributions even if runtime feature flags exist.
 */
export function allowAdultScannerSurfaces(): boolean {
  return Boolean(BUILD_ALLOW_ADULT_BUNDLE);
}
