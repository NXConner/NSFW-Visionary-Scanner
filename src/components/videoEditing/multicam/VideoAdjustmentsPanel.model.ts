export interface VideoAdjustmentsState {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  hdr: boolean;
  hdrIntensity: number;
  blackAndWhite: boolean;
  bwIntensity: number;
}

export const defaultVideoAdjustments: VideoAdjustmentsState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  hdr: false,
  hdrIntensity: 50,
  blackAndWhite: false,
  bwIntensity: 100,
};
