export interface TransitionConfig {
  type: "cut" | "crossfade" | "dipToBlack" | "wipe" | "zoom" | "glitch" | "slide";
  duration: number; // ms
  direction?: "left" | "right" | "up" | "down";
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export const defaultTransition: TransitionConfig = {
  type: "cut",
  duration: 500,
  direction: "right",
  easing: "easeInOut",
};
