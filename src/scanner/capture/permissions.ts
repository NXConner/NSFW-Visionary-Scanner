import { getPlatformKind } from "@/scanner/utils/platform";

export interface CameraPermissionState {
  status: "unknown" | "granted" | "denied" | "prompt";
  platform: "web" | "capacitor";
}

export async function getCameraPermissionState(): Promise<CameraPermissionState> {
  const platform = getPlatformKind();
  if (platform === "web") {
    try {
      const perms = (navigator as any)?.permissions;
      if (perms?.query) {
        const res = await perms.query({ name: "camera" as any });
        return { status: res.state, platform: "web" };
      }
    } catch {
      // ignore
    }
    return { status: "unknown", platform: "web" };
  }

  // Capacitor: permission is handled by the native layer / WebView prompt.
  return { status: "unknown", platform: "capacitor" };
}
