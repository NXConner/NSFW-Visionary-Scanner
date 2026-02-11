export interface FrameSource {
  kind: "video" | "image";
  /** Capture a still frame as data URL. */
  captureDataUrl: () => Promise<string | null>;
  /** Optional cleanup. */
  stop?: () => void;
}
