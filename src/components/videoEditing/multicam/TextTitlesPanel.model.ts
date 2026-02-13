export interface TextOverlay {
  id: string;
  type: "title" | "lowerThird" | "caption" | "watermark";
  text: string;
  subtitle?: string;
  position: { x: number; y: number };
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  opacity: number;
  animation: "none" | "fadeIn" | "slideUp" | "typewriter" | "glitch";
  alignment: "left" | "center" | "right";
  startTime: number;
  duration: number;
}

export interface TextOverlaysState {
  overlays: TextOverlay[];
  activeOverlayId: string | null;
}

export const defaultTextState: TextOverlaysState = {
  overlays: [],
  activeOverlayId: null,
};
