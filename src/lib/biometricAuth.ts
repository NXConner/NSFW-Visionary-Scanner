/**
 * Biometric Authentication Utilities
 * Supports Face ID, Touch ID, and Fingerprint authentication
 */

import { Capacitor } from '@capacitor/core';
import { BiometricType, NativeBiometric } from 'capacitor-native-biometric';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<{
  available: boolean;
  type?: BiometricType;
  error?: string;
}> {
  try {
    if (Capacitor.getPlatform() === 'web') {
      // Check Web Authentication API
      if (window.PublicKeyCredential) {
        return { available: true, type: 'fingerprint' };
      }
      return { available: false, error: 'Biometric authentication not supported on web' };
    }

    // Native platforms
    const result = await NativeBiometric.checkAvailability();
    return {
      available: result.isAvailable,
      type: result.biometryType,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometric(
  reason: string = 'Authenticate to access MorphoScan Pro'
): Promise<BiometricAuthResult> {
  try {
    if (Capacitor.getPlatform() === 'web') {
      // Use Web Authentication API
      if (!window.PublicKeyCredential) {
        return { success: false, error: 'Biometric authentication not supported' };
      }

      // WebAuthn credential request
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required',
        },
      });

      if (credential) {
        return { success: true, biometricType: 'fingerprint' };
      }

      return { success: false, error: 'Authentication cancelled' };
    }

    // Native platforms
    const result = await NativeBiometric.verifyIdentity({
      reason,
      title: 'Biometric Authentication',
      subtitle: 'Use your biometric to unlock',
      description: 'Authenticate to access your health data',
      useFallback: true,
      fallbackTitle: 'Use PIN',
    });

    if (result.verified) {
      const availability = await isBiometricAvailable();
      return {
        success: true,
        biometricType: availability.type,
      };
    }

    return { success: false, error: 'Authentication failed' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication error',
    };
  }
}

/**
 * Get biometric type name for display
 */
export function getBiometricTypeName(type?: BiometricType): string {
  switch (type) {
    case 'faceID':
      return 'Face ID';
    case 'touchID':
      return 'Touch ID';
    case 'fingerprint':
      return 'Fingerprint';
    case 'face':
      return 'Face Recognition';
    case 'iris':
      return 'Iris';
    default:
      return 'Biometric';
  }
}

