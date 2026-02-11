import { getPlatformKind } from "@/scanner/utils/platform";

/**
 * Best-effort Capacitor native capture.
 *
 * This will use @capacitor/camera if installed. If not installed, returns null so callers can fall back to getUserMedia.
 */
export async function captureWithCapacitorCamera(): Promise<string | null> {
  if (getPlatformKind() !== "capacitor") return null;

  try {
    const mod = await import("@capacitor/camera");
    const Camera = mod.Camera;
    const result = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: mod.CameraResultType.DataUrl,
      source: mod.CameraSource.Camera,
      direction: mod.CameraDirection.Rear,
      saveToGallery: false,
    });

    return result?.dataUrl ?? null;
  } catch {
    return null;
  }
}
