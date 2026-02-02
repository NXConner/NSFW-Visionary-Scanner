import type { NormalizedOrientation } from "@/scanner/utils/image/exif";

export interface CaptureMeta {
  createdAt: string;
  platform: "web" | "capacitor";
  width: number;
  height: number;
  mimeType: string;
  orientation: NormalizedOrientation;
}

export interface CaptureResult {
  blob: Blob;
  meta: CaptureMeta;
}
