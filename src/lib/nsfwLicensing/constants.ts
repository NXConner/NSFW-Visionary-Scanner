export const LICENSE_TYPES = [
  "exclusive",
  "non_exclusive",
  "time_limited_exclusive",
  "content_pool",
  "custom",
] as const;

export const LICENSE_STATUSES = ["active", "pending", "expired", "revoked", "archived"] as const;

export const CONTENT_TYPES = ["video", "image", "audio", "text", "nsfw_video"] as const;

export const PLATFORM_TYPES = ["web", "ios", "android", "tv", "vr", "offline"] as const;

export const DISTRIBUTION_CHANNELS = ["direct", "app_store", "play_store", "web", "partner"] as const;
