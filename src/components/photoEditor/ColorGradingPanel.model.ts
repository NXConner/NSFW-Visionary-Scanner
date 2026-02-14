export interface ColorGradingState {
  hue: number;
  saturation: number;
  luminance: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  vibrance: number;
  splitToneHighlightsHue: number;
  splitToneShadowsHue: number;
  splitToneBalance: number;
}

export const defaultColorGrading: ColorGradingState = {
  hue: 0,
  saturation: 0,
  luminance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  vibrance: 0,
  splitToneHighlightsHue: 30,
  splitToneShadowsHue: 220,
  splitToneBalance: 0,
};
