export interface OverlayState {
  filmGrain: number;
  grainSize: "fine" | "medium" | "coarse";
  lightLeak: string | null;
  lightLeakIntensity: number;
  bokeh: number;
  bokehSize: number;
  dustScratches: number;
  textureOverlay: string | null;
  textureOpacity: number;
  chromaAberration: number;
}

export const defaultOverlays: OverlayState = {
  filmGrain: 0,
  grainSize: "fine",
  lightLeak: null,
  lightLeakIntensity: 50,
  bokeh: 0,
  bokehSize: 50,
  dustScratches: 0,
  textureOverlay: null,
  textureOpacity: 30,
  chromaAberration: 0,
};
