/**
 * Content Encryption System
 * Handles encryption and decryption of DLC content
 */

import { logger } from "@/lib/logger";

// ============================================
// Types
// ============================================

interface EncryptedContent {
  data: string;
  iv: string;
  salt: string;
  algorithm: string;
  version: number;
}

interface ContentKey {
  id: string;
  key: CryptoKey;
  expiresAt: Date;
  packageId: string;
}

// ============================================
// Constants
// ============================================

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATION_COUNT = 100000;
const VERSION = 1;

// ============================================
// Encryption Class
// ============================================

class ContentEncryption {
  private keyCache: Map<string, ContentKey> = new Map();

  /**
   * Generate a random encryption key
   */
  async generateKey(): Promise<{ key: CryptoKey; exportedKey: string }> {
    const key = await crypto.subtle.generateKey({ name: ALGORITHM, length: KEY_LENGTH }, true, [
      "encrypt",
      "decrypt",
    ]);

    const exportedKey = await this.exportKey(key);

    return { key, exportedKey };
  }

  /**
   * Export a key to base64 string
   */
  async exportKey(key: CryptoKey): Promise<string> {
    const rawKey = await crypto.subtle.exportKey("raw", key);
    return this.arrayBufferToBase64(rawKey);
  }

  /**
   * Import a key from base64 string
   */
  async importKey(keyData: string): Promise<CryptoKey> {
    const rawKey = this.base64ToArrayBuffer(keyData);

    return await crypto.subtle.importKey(
      "raw",
      rawKey.buffer as ArrayBuffer,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ["encrypt", "decrypt"],
    );
  }

  /**
   * Derive a key from password and salt
   */
  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt.buffer as ArrayBuffer,
        iterations: ITERATION_COUNT,
        hash: "SHA-256",
      },
      passwordKey,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ["encrypt", "decrypt"],
    );
  }

  /**
   * Encrypt content
   */
  async encrypt(content: string | ArrayBuffer, key: CryptoKey): Promise<EncryptedContent> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

    const data =
      typeof content === "string" ? new TextEncoder().encode(content) : new Uint8Array(content);

    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
      key,
      data,
    );

    return {
      data: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer as ArrayBuffer),
      salt: this.arrayBufferToBase64(salt.buffer as ArrayBuffer),
      algorithm: ALGORITHM,
      version: VERSION,
    };
  }

  /**
   * Decrypt content
   */
  async decrypt(encrypted: EncryptedContent, key: CryptoKey): Promise<ArrayBuffer> {
    const iv = this.base64ToArrayBuffer(encrypted.iv);
    const data = this.base64ToArrayBuffer(encrypted.data);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
      key,
      data.buffer as ArrayBuffer,
    );

    return decrypted;
  }

  /**
   * Decrypt content to string
   */
  async decryptToString(encrypted: EncryptedContent, key: CryptoKey): Promise<string> {
    const decrypted = await this.decrypt(encrypted, key);
    return new TextDecoder().decode(decrypted);
  }

  /**
   * Encrypt a file
   */
  async encryptFile(file: File, key: CryptoKey): Promise<Blob> {
    const buffer = await file.arrayBuffer();
    const encrypted = await this.encrypt(buffer, key);

    // Create a JSON blob with encrypted data
    const jsonData = JSON.stringify(encrypted);
    return new Blob([jsonData], { type: "application/dlc-encrypted" });
  }

  /**
   * Decrypt a file
   */
  async decryptFile(encryptedBlob: Blob, key: CryptoKey, mimeType: string): Promise<Blob> {
    const jsonData = await encryptedBlob.text();
    const encrypted = JSON.parse(jsonData) as EncryptedContent;

    const decrypted = await this.decrypt(encrypted, key);
    return new Blob([decrypted], { type: mimeType });
  }

  /**
   * Get or create a cached content key
   */
  async getContentKey(
    packageId: string,
    keyId: string,
    keyFetcher: () => Promise<string>,
  ): Promise<CryptoKey> {
    const cacheKey = `${packageId}-${keyId}`;

    // Check cache
    const cached = this.keyCache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached.key;
    }

    // Fetch and import key
    logger.debug("ContentEncryption: Fetching content key", { packageId, keyId });

    const keyData = await keyFetcher();
    const key = await this.importKey(keyData);

    // Cache key for 1 hour
    this.keyCache.set(cacheKey, {
      id: keyId,
      key,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      packageId,
    });

    return key;
  }

  /**
   * Clear cached keys for a package
   */
  clearPackageKeys(packageId: string): void {
    for (const [key, value] of this.keyCache.entries()) {
      if (value.packageId === packageId) {
        this.keyCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached keys
   */
  clearAllKeys(): void {
    this.keyCache.clear();
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

// Export singleton instance
export const contentEncryption = new ContentEncryption();

// ============================================
// Integrity Checking
// ============================================

export class IntegrityChecker {
  /**
   * Calculate SHA-256 hash of content
   */
  async calculateHash(content: ArrayBuffer | string): Promise<string> {
    const data =
      typeof content === "string" ? new TextEncoder().encode(content) : new Uint8Array(content);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return this.arrayBufferToHex(hashBuffer);
  }

  /**
   * Calculate hash of a file
   */
  async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    return this.calculateHash(buffer);
  }

  /**
   * Calculate hash of a blob
   */
  async calculateBlobHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    return this.calculateHash(buffer);
  }

  /**
   * Verify content integrity
   */
  async verify(content: ArrayBuffer | string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.calculateHash(content);
    return this.secureCompare(actualHash, expectedHash);
  }

  /**
   * Verify file integrity
   */
  async verifyFile(file: File, expectedHash: string): Promise<boolean> {
    const actualHash = await this.calculateFileHash(file);
    return this.secureCompare(actualHash, expectedHash);
  }

  /**
   * Secure string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

// Export singleton instance
export const integrityChecker = new IntegrityChecker();
