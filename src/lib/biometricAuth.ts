/**
 * Biometric Authentication
 *
 * Uses `capacitor-native-biometric` on iOS/Android and provides a safe no-op
 * implementation on web.
 *
 * Note: This is a non-React utility module (the React hook lives at `src/hooks/useBiometricAuth.ts`).
 */

import { Capacitor } from "@capacitor/core";

export type BiometricType = "touchId" | "faceId" | "fingerprint" | "face" | "iris" | "none";

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

export async function isBiometricAvailable(): Promise<{
  available: boolean;
  type?: BiometricType;
  error?: string;
}> {
  const platform = Capacitor.getPlatform();
  if (platform === "web") {
    return { available: false, error: "Biometric authentication not supported on web" };
  }

  try {
    const { NativeBiometric } = await import("capacitor-native-biometric");
    const result = await NativeBiometric.isAvailable();

    const typeMap: Record<number, BiometricType> = {
      1: "fingerprint",
      2: "face",
      3: "iris",
      4: "fingerprint",
    };

    return {
      available: Boolean(result.isAvailable),
      type: result.biometryType ? typeMap[result.biometryType] : undefined,
    };
  } catch (e) {
    return { available: false, error: e instanceof Error ? e.message : "Biometric not available" };
  }
}

export async function authenticateWithBiometric(
  reason: string = "Authenticate",
): Promise<BiometricAuthResult> {
  const availability = await isBiometricAvailable();
  if (!availability.available)
    return { success: false, error: availability.error ?? "Not available on this platform" };

  try {
    const { NativeBiometric } = await import("capacitor-native-biometric");
    await NativeBiometric.verifyIdentity({
      reason,
      title: "Biometric Authentication",
      subtitle: "Verify your identity",
      description: "Use your fingerprint or face to continue",
      maxAttempts: 3,
      useFallback: true,
      fallbackTitle: "Use PIN",
    });
    return { success: true, biometricType: availability.type };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Biometric authentication failed",
      biometricType: availability.type,
    };
  }
}

function resolveServerKey(server?: string) {
  if (server && server.trim()) return server.trim();
  // Prefer deployment host as a stable key; fallback to an app constant.
  if (typeof window !== "undefined" && window.location?.host) return window.location.host;
  return "app.local";
}

export async function setBiometricCredentials(
  server: string,
  username: string,
  password: string,
): Promise<boolean> {
  const availability = await isBiometricAvailable();
  if (!availability.available) return false;

  try {
    const { NativeBiometric } = await import("capacitor-native-biometric");
    await NativeBiometric.setCredentials({
      username,
      password,
      server: resolveServerKey(server),
    });
    return true;
  } catch {
    return false;
  }
}

export async function getBiometricCredentials(
  server: string,
): Promise<{ username: string; password: string } | null> {
  const availability = await isBiometricAvailable();
  if (!availability.available) return null;

  const auth = await authenticateWithBiometric("Verify your identity to retrieve credentials");
  if (!auth.success) return null;

  try {
    const { NativeBiometric } = await import("capacitor-native-biometric");
    const credentials = await NativeBiometric.getCredentials({
      server: resolveServerKey(server),
    });
    return credentials ?? null;
  } catch {
    return null;
  }
}

export async function deleteBiometricCredentials(server: string): Promise<boolean> {
  const availability = await isBiometricAvailable();
  if (!availability.available) return false;

  try {
    const { NativeBiometric } = await import("capacitor-native-biometric");
    await NativeBiometric.deleteCredentials({
      server: resolveServerKey(server),
    });
    return true;
  } catch {
    return false;
  }
}
