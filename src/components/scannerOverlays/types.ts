export interface ScannerSettings {
  showPositioningGuide: boolean;
  showGrid: boolean;
  showQualityIndicators: boolean;
  showDistanceIndicator: boolean;
  showTiltIndicator: boolean;
  showEdgeDetection: boolean;
  showGhostOverlay: boolean;
  showVirtualRuler: boolean;
  showStepGuide: boolean;
  showObjectDetection: boolean;
  showMeasurementGuides: boolean;
  autoCapture: boolean;
  autoCaptureDelay: number;
  voiceGuidance: boolean;
  hapticFeedback: boolean;

  // Focus Controls
  focusMode: "auto" | "continuous" | "manual" | "single-shot";
  tapToFocusEnabled: boolean;
  focusDistance: number; // 0..1 normalized when supported
  showFocusIndicator: boolean;

  // Object Detection
  enableRealDetection: boolean;
  detectionThreshold: number; // 0..1
  maxDetectedObjects: number;
  showDetectionConfidence: boolean;

  /**
   * Cloud AI analysis (uploads the captured image to the backend for analysis).
   * This should always be opt-in.
   */
  enableCloudAiAnalysis: boolean;

  // Tracking
  enableTracking: boolean;
  showMotionTrails: boolean;
  trackingLockEnabled: boolean;
  showObjectIds: boolean;

  // Auto-tracking (tap to select and follow)
  enableAutoTracking: boolean;
  autoTrackingFocusEnabled: boolean; // Auto-focus follows tracked object

  // Masking
  enableMasking: boolean;
  maskingMode: "none" | "blur" | "darken" | "pixelate";
  maskIntensity: number; // 0-100

  // Feedback
  enableCaptureFlash: boolean;
  enableSoundFeedback: boolean;
  soundVolume: number; // 0..1
  showStatusBar: boolean;
  showMLIndicator: boolean;

  // Curvature Detection (PMC10150132 4-point landmark method)
  showLandmarkCurvature: boolean;
  showCurvatureClinicalNote: boolean;
}

export const defaultScannerSettings: ScannerSettings = {
  showPositioningGuide: true,
  showGrid: false,
  showQualityIndicators: false,
  showDistanceIndicator: false,
  showTiltIndicator: false,
  showEdgeDetection: false,
  showGhostOverlay: false,
  showVirtualRuler: false,
  showStepGuide: false,
  showObjectDetection: true,
  showMeasurementGuides: true,
  autoCapture: false,
  autoCaptureDelay: 3,
  voiceGuidance: false,
  hapticFeedback: true,

  focusMode: "continuous",
  tapToFocusEnabled: true,
  focusDistance: 0.5,
  showFocusIndicator: true,

  enableRealDetection: false,
  detectionThreshold: 0.72,
  maxDetectedObjects: 5,
  showDetectionConfidence: true,
  enableCloudAiAnalysis: false,

  enableTracking: true,
  showMotionTrails: true,
  trackingLockEnabled: true,
  showObjectIds: true,

  enableAutoTracking: true,
  autoTrackingFocusEnabled: true,

  enableMasking: false,
  maskingMode: "blur",
  maskIntensity: 60,

  enableCaptureFlash: true,
  enableSoundFeedback: false,
  soundVolume: 0.6,
  showStatusBar: true,
  showMLIndicator: true,

  // Curvature Detection defaults
  showLandmarkCurvature: true,
  showCurvatureClinicalNote: false,
};

export const booleanScannerSettingKeys = [
  "showPositioningGuide",
  "showGrid",
  "showQualityIndicators",
  "showDistanceIndicator",
  "showTiltIndicator",
  "showEdgeDetection",
  "showGhostOverlay",
  "showVirtualRuler",
  "showStepGuide",
  "showObjectDetection",
  "showMeasurementGuides",
  "autoCapture",
  "voiceGuidance",
  "hapticFeedback",
  "tapToFocusEnabled",
  "showFocusIndicator",
  "enableRealDetection",
  "showDetectionConfidence",
  "enableCloudAiAnalysis",
  "enableTracking",
  "showMotionTrails",
  "trackingLockEnabled",
  "showObjectIds",
  "enableAutoTracking",
  "autoTrackingFocusEnabled",
  "enableMasking",
  "enableCaptureFlash",
  "enableSoundFeedback",
  "showStatusBar",
  "showMLIndicator",
  "showLandmarkCurvature",
  "showCurvatureClinicalNote",
] as const satisfies ReadonlyArray<keyof ScannerSettings>;

export type BooleanScannerSettingKey = (typeof booleanScannerSettingKeys)[number];
