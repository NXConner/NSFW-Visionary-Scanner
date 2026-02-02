export type NsfwLabel = "neutral" | "suggestive" | "explicit" | "unknown";

export type NsfwDetectionResult = {
  label: NsfwLabel;
  confidence: number; // 0..1
  model: "nsfwjs";
  raw?: Record<string, number>;
};

export type NsfwScannerPolicy = {
  enabled: boolean;
  /**
   * When false, scanner will block saving if explicit content is detected above threshold.
   */
  allowExplicit: boolean;
  /**
   * Probability threshold for considering content explicit.
   */
  explicitThreshold: number; // default 0.7
  /**
   * Probability threshold for considering content suggestive.
   */
  suggestiveThreshold: number; // default 0.7
  /**
   * If enabled, we run the model locally on-device after capture.
   */
  enableOnDeviceDetection: boolean;
  /**
   * If enabled, store classification metadata (label/confidence) alongside the saved scan.
   * Disabled by default for privacy.
   */
  storeClassificationMetadata: boolean;
};

export const DEFAULT_NSFW_SCANNER_POLICY: NsfwScannerPolicy = {
  enabled: false,
  allowExplicit: false,
  explicitThreshold: 0.7,
  suggestiveThreshold: 0.7,
  enableOnDeviceDetection: true,
  storeClassificationMetadata: false,
};

