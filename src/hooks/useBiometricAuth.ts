/**
 * Biometric Authentication Hook
 * Uses capacitor-native-biometric for fingerprint/face authentication
 */
import { useState, useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useGenericStorage } from "./useGenericStorage";

interface BiometricSettings {
  enabled: boolean;
  type: "fingerprint" | "face" | "iris" | "multiple" | "none";
  lastUsed: string | null;
}

const defaultSettings: BiometricSettings = {
  enabled: false,
  type: "none",
  lastUsed: null,
};

export const useBiometricAuth = () => {
  const [settings, setSettings] = useGenericStorage<BiometricSettings>(
    "biometric_settings",
    defaultSettings,
  );
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async () => {
    const platform = Capacitor.getPlatform();

    // Only available on native platforms
    if (platform !== "ios" && platform !== "android") {
      setIsAvailable(false);
      return false;
    }

    try {
      const { NativeBiometric } = await import("capacitor-native-biometric");
      const result = await NativeBiometric.isAvailable();

      setIsAvailable(result.isAvailable);

      if (result.isAvailable && result.biometryType) {
        const typeMap: Record<number, BiometricSettings["type"]> = {
          1: "fingerprint",
          2: "face",
          3: "iris",
          4: "multiple",
        };
        setSettings(prev => ({
          ...prev,
          type: typeMap[result.biometryType] || "fingerprint",
        }));
      }

      return result.isAvailable;
    } catch (err: unknown) {
      // Intentionally quiet in non-native/test environments
      setIsAvailable(false);
      return false;
    }
  }, [setSettings]);

  // Check biometric availability on mount
  useEffect(() => {
    void checkAvailability();
  }, [checkAvailability]);

  const authenticate = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!isAvailable || !settings.enabled) {
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { NativeBiometric } = await import("capacitor-native-biometric");

        await NativeBiometric.verifyIdentity({
          reason: reason || "Verify your identity to continue",
          title: "MorphoScan",
          subtitle: "Biometric Authentication",
          description: "Use your fingerprint or face to unlock",
          maxAttempts: 3,
          useFallback: true,
          fallbackTitle: "Use PIN",
        });

        setIsAuthenticated(true);
        setSettings(prev => ({
          ...prev,
          lastUsed: new Date().toISOString(),
        }));

        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Biometric authentication failed";
        setError(message);
        setIsAuthenticated(false);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isAvailable, settings.enabled, setSettings],
  );

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    const available = await checkAvailability();

    if (!available) {
      setError("Biometric authentication is not available on this device");
      return false;
    }

    // Verify identity before enabling
    try {
      const { NativeBiometric } = await import("capacitor-native-biometric");

      await NativeBiometric.verifyIdentity({
        reason: "Verify your identity to enable biometric login",
        title: "Enable Biometric Login",
        maxAttempts: 3,
      });

      setSettings(prev => ({
        ...prev,
        enabled: true,
        lastUsed: new Date().toISOString(),
      }));

      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to enable biometric");
      return false;
    }
  }, [checkAvailability, setSettings]);

  const disableBiometric = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      enabled: false,
    }));
    setIsAuthenticated(false);
  }, [setSettings]);

  const storeCredentials = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      if (!isAvailable) return false;

      try {
        const { NativeBiometric } = await import("capacitor-native-biometric");

        await NativeBiometric.setCredentials({
          username,
          password,
          server: "app.morphoscan.health",
        });

        return true;
      } catch (err) {
        return false;
      }
    },
    [isAvailable],
  );

  const getCredentials = useCallback(async (): Promise<{
    username: string;
    password: string;
  } | null> => {
    if (!isAvailable || !settings.enabled) return null;

    try {
      const { NativeBiometric } = await import("capacitor-native-biometric");

      // Verify identity first
      await NativeBiometric.verifyIdentity({
        reason: "Verify your identity to retrieve credentials",
        title: "Biometric Login",
        maxAttempts: 3,
      });

      const credentials = await NativeBiometric.getCredentials({
        server: "app.morphoscan.health",
      });

      setIsAuthenticated(true);
      return credentials;
    } catch (err) {
      return null;
    }
  }, [isAvailable, settings.enabled]);

  const deleteCredentials = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false;

    try {
      const { NativeBiometric } = await import("capacitor-native-biometric");

      await NativeBiometric.deleteCredentials({
        server: "app.morphoscan.health",
      });

      return true;
    } catch (err) {
      return false;
    }
  }, [isAvailable]);

  const getBiometricTypeName = useCallback((): string => {
    switch (settings.type) {
      case "fingerprint":
        return "Fingerprint";
      case "face":
        return "Face ID";
      case "iris":
        return "Iris Scan";
      case "multiple":
        return "Biometric";
      default:
        return "Biometric";
    }
  }, [settings.type]);

  return {
    // State
    settings,
    isAvailable,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    checkAvailability,
    authenticate,
    enableBiometric,
    disableBiometric,
    storeCredentials,
    getCredentials,
    deleteCredentials,

    // Helpers
    getBiometricTypeName,
  };
};

export default useBiometricAuth;
