export interface BlurFocusState {
  blur: number;
  blurType: "gaussian" | "radial" | "tiltShift";
  radialCenterX: number;
  radialCenterY: number;
  radialRadius: number;
  tiltShiftPosition: number;
  tiltShiftFeather: number;
  sharpen: number;
  clarity: number;
  vignette: number;
  vignetteFeather: number;
  dehaze: number;
}

export const defaultBlurFocus: BlurFocusState = {
  blur: 0,
  blurType: "gaussian",
  radialCenterX: 50,
  radialCenterY: 50,
  radialRadius: 50,
  tiltShiftPosition: 50,
  tiltShiftFeather: 30,
  sharpen: 0,
  clarity: 0,
  vignette: 0,
  vignetteFeather: 50,
  dehaze: 0,
};
