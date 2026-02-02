export type AdvancedNsfwDetectionPolicy = {
  /**
   * Local user toggle. Even if entitled, the user must explicitly enable.
   */
  enabled: boolean;

  /**
   * If enabled, we will store only detection metadata (never the image)
   * into Supabase tables for review/debugging.
   */
  storeDetectionHistory: boolean;

  /**
   * 0..1 confidence threshold used for labeling/alerts.
   */
  confidenceThreshold: number;

  /**
   * If enabled, UI can show more verbose breakdowns.
   */
  showDetailedBreakdown: boolean;

  /**
   * If enabled, allow comparing multiple model outputs.
   * (Currently only NSFWJS is run on-device; additional models may be added when configured.)
   */
  enableComparisonMode: boolean;
};

export const DEFAULT_ADVANCED_NSFW_DETECTION_POLICY: AdvancedNsfwDetectionPolicy = {
  enabled: false,
  storeDetectionHistory: false,
  confidenceThreshold: 0.5,
  showDetailedBreakdown: true,
  enableComparisonMode: false,
};
