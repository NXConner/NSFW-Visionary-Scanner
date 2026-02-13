import { getPlatformKind } from "@/scanner/utils/platform";
import { Camera } from "@capacitor/camera";
import { logger } from "@/lib/logger";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unknown";

export interface CameraPermissionResult {
  status: PermissionStatus;
  canRequest: boolean;
}

/**
 * Request camera permissions for Android/Capacitor.
 * Uses Capacitor Camera plugin's permission system.
 */
export async function requestCameraPermission(): Promise<CameraPermissionResult> {
  const platform = getPlatformKind();

  // On web, permissions are handled by getUserMedia prompt
  if (platform === "web") {
    return { status: "prompt", canRequest: true };
  }

  // On Capacitor/Android, use Camera plugin's permission system
  try {
    // Check current permission status
    const checkResult = await Camera.checkPermissions();

    if (checkResult.camera === "granted") {
      return { status: "granted", canRequest: false };
    }

    if (checkResult.camera === "denied") {
      return { status: "denied", canRequest: false };
    }

    // Request permission if not granted
    const requestResult = await Camera.requestPermissions({ permissions: ["camera"] });

    if (requestResult.camera === "granted") {
      return { status: "granted", canRequest: false };
    }

    if (requestResult.camera === "denied") {
      return { status: "denied", canRequest: false };
    }

    return { status: "prompt", canRequest: true };
  } catch (error) {
    logger.warn("[androidPermissions] camera permission request/check failed", { error });
    // Fallback: assume we can try (getUserMedia will handle the prompt)
    return { status: "unknown", canRequest: true };
  }
}

/**
 * Check camera permission status without requesting.
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  const platform = getPlatformKind();

  if (platform === "web") {
    try {
      const perms = (navigator as any)?.permissions;
      if (perms?.query) {
        const res = await perms.query({ name: "camera" as any });
        return res.state as PermissionStatus;
      }
    } catch {
      // ignore
    }
    return "unknown";
  }

  // On Capacitor/Android
  try {
    const result = await Camera.checkPermissions();
    return (result.camera || "unknown") as PermissionStatus;
  } catch (error) {
    logger.warn("[androidPermissions] camera permission check failed", { error });
    return "unknown";
  }
}
