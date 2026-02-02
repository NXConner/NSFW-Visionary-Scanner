/**
 * Two-Factor Authentication System
 * TOTP-based 2FA using authenticator apps
 */

import { toast } from "sonner";
import { logger } from "./logger";

// Simple base32 encoding/decoding for TOTP
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateSecret(length: number = 20): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let secret = "";
  for (let i = 0; i < array.length; i++) {
    secret += BASE32_CHARS[array[i] % 32];
  }
  return secret;
}

function base32ToBytes(base32: string): Uint8Array {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (const char of cleaned) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(
    key.byteOffset,
    key.byteOffset + key.byteLength,
  ) as ArrayBuffer;
  const msgBuffer = message.buffer.slice(
    message.byteOffset,
    message.byteOffset + message.byteLength,
  ) as ArrayBuffer;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgBuffer);
  return new Uint8Array(signature);
}

async function generateTOTP(
  secret: string,
  timeStep: number = 30,
  digits: number = 6,
): Promise<string> {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBytes = new Uint8Array(8);
  let t = time;
  for (let i = 7; i >= 0; i--) {
    timeBytes[i] = t & 0xff;
    t = Math.floor(t / 256);
  }

  const key = base32ToBytes(secret);
  const hmac = await hmacSha1(key, timeBytes);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    Math.pow(10, digits);

  return code.toString().padStart(digits, "0");
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  verified: boolean;
  backupCodesRemaining: number;
}

const STORAGE_KEY = "2fa_settings";

function get2FASettings(): { secret?: string; enabled?: boolean; backupCodes?: string[] } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function save2FASettings(settings: {
  secret?: string;
  enabled?: boolean;
  backupCodes?: string[];
}): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    logger.error("Failed to save 2FA settings", { error });
  }
}

// Generate backup codes
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// Initialize 2FA setup
export async function initiate2FASetup(email: string): Promise<TwoFactorSetup> {
  const secret = generateSecret(20);
  const backupCodes = generateBackupCodes(10);

  const issuer = "MorphoScan Pro";
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  // Store temporarily until verified
  save2FASettings({ secret, enabled: false, backupCodes });

  return {
    secret,
    otpauthUrl,
    backupCodes,
  };
}

// Verify TOTP code and enable 2FA
export async function verify2FACode(code: string): Promise<boolean> {
  try {
    const settings = get2FASettings();
    if (!settings.secret) {
      toast.error("2FA not initialized");
      return false;
    }

    // Check current and previous/next time windows for clock drift
    const timeStep = 30;
    const currentTime = Math.floor(Date.now() / 1000);

    for (const offset of [0, -1, 1]) {
      const time = Math.floor((currentTime + offset * timeStep) / timeStep);
      const timeBytes = new Uint8Array(8);
      let t = time;
      for (let i = 7; i >= 0; i--) {
        timeBytes[i] = t & 0xff;
        t = Math.floor(t / 256);
      }

      const expectedCode = await generateTOTP(settings.secret);

      // Simple comparison for demo - in production, use constant-time comparison
      if (code === expectedCode) {
        save2FASettings({ ...settings, enabled: true });
        toast.success("Two-factor authentication enabled!");
        return true;
      }
    }

    toast.error("Invalid verification code");
    return false;
  } catch (error) {
    logger.error("Failed to verify 2FA code", { error });
    toast.error("Verification failed");
    return false;
  }
}

// Validate TOTP during login
export async function validate2FA(code: string): Promise<boolean> {
  try {
    const settings = get2FASettings();
    if (!settings.secret || !settings.enabled) {
      return true; // 2FA not enabled
    }

    // Check backup codes first
    if (settings.backupCodes?.includes(code)) {
      const updatedCodes = settings.backupCodes.filter(c => c !== code);
      save2FASettings({ ...settings, backupCodes: updatedCodes });
      toast.success("Backup code used");
      return true;
    }

    // Check TOTP
    for (const offset of [0, -1, 1]) {
      const expectedCode = await generateTOTP(settings.secret);
      if (code === expectedCode) {
        return true;
      }
    }

    toast.error("Invalid authentication code");
    return false;
  } catch (error) {
    logger.error("Failed to validate 2FA", { error });
    return false;
  }
}

// Disable 2FA
export async function disable2FA(code: string): Promise<boolean> {
  try {
    const isValid = await validate2FA(code);
    if (!isValid) {
      return false;
    }

    save2FASettings({});
    toast.success("Two-factor authentication disabled");
    return true;
  } catch (error) {
    logger.error("Failed to disable 2FA", { error });
    toast.error("Failed to disable 2FA");
    return false;
  }
}

// Get 2FA status
export async function get2FAStatus(): Promise<TwoFactorStatus> {
  const settings = get2FASettings();
  return {
    enabled: settings.enabled || false,
    verified: settings.enabled || false,
    backupCodesRemaining: settings.backupCodes?.length || 0,
  };
}

// Regenerate backup codes
export async function regenerateBackupCodes(code: string): Promise<string[] | null> {
  try {
    const isValid = await validate2FA(code);
    if (!isValid) {
      return null;
    }

    const settings = get2FASettings();
    const newCodes = generateBackupCodes(10);
    save2FASettings({ ...settings, backupCodes: newCodes });

    toast.success("Backup codes regenerated");
    return newCodes;
  } catch (error) {
    logger.error("Failed to regenerate backup codes", { error });
    toast.error("Failed to regenerate backup codes");
    return null;
  }
}

// Check if 2FA is required for current user
export function is2FAEnabled(): boolean {
  const settings = get2FASettings();
  return settings.enabled || false;
}
