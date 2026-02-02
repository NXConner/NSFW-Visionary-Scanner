import type { FrameSource } from "./frameSource";
import { captureWithCapacitorCamera } from "./capacitorCamera";
import { dataUrlToBlob } from "@/scanner/utils/image";
import { getPlatformKind } from "@/scanner/utils/platform";
import { normalizeImageBlobOrientation } from "@/scanner/utils/image/exif";
import type { CaptureResult } from "./types";

export interface CaptureSessionOptions {
  preferNativeOnMobile?: boolean;
}

export async function captureStill(
  session: FrameSource,
  _opts: CaptureSessionOptions = {},
): Promise<string | null> {
  return await session.captureDataUrl();
}

export async function captureStillBlob(
  session: FrameSource,
  opts: { normalizeOrientation?: boolean } = {},
): Promise<CaptureResult | null> {
  const dataUrl = await session.captureDataUrl();
  if (!dataUrl) return null;
  const blob = await dataUrlToBlob(dataUrl);
  const normalized = opts.normalizeOrientation ? await normalizeImageBlobOrientation(blob) : null;
  const outBlob = normalized?.blob ?? blob;
  const orientation = normalized?.orientation ?? "unknown";

  // Dimensions are unknown without decoding; we keep 0/0 here and fill later where needed.
  return {
    blob: outBlob,
    meta: {
      createdAt: new Date().toISOString(),
      platform: getPlatformKind(),
      width: 0,
      height: 0,
      mimeType: outBlob.type || "image/jpeg",
      orientation,
    },
  };
}

/**
 * One-shot capture helper:
 * - On Capacitor (native), attempt Camera plugin first.
 * - Otherwise return null so the caller can use its existing preview pipeline.
 */
export async function captureStillNativePreferred(): Promise<string | null> {
  return await captureWithCapacitorCamera();
}
