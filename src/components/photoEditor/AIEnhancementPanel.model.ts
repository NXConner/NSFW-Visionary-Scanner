export interface AIEnhancementState {
  // Style Transfer
  styleTransferEnabled: boolean;
  styleType: "oilPainting" | "watercolor" | "sketch" | "anime" | "impressionist" | null;
  styleIntensity: number;

  // Portrait Mode
  portraitModeEnabled: boolean;
  backgroundBlur: number;
  skinSmoothing: number;
  faceLighting: number;

  // Object Removal
  objectRemovalEnabled: boolean;
  removeBackground: boolean;
  blurBackground: boolean;
  backgroundBlurAmount: number;

  // Color Match
  colorMatchEnabled: boolean;
  referenceImage: string | null;
  matchIntensity: number;

  // Auto Enhancement
  autoEnhanceEnabled: boolean;
  autoEnhanceStrength: number;
}

export const defaultAIEnhancement: AIEnhancementState = {
  styleTransferEnabled: false,
  styleType: null,
  styleIntensity: 75,

  portraitModeEnabled: false,
  backgroundBlur: 50,
  skinSmoothing: 30,
  faceLighting: 0,

  objectRemovalEnabled: false,
  removeBackground: false,
  blurBackground: false,
  backgroundBlurAmount: 50,

  colorMatchEnabled: false,
  referenceImage: null,
  matchIntensity: 75,

  autoEnhanceEnabled: false,
  autoEnhanceStrength: 50,
};
