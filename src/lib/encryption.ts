// Simple encryption using Web Crypto API for local storage data
const ENCRYPTION_KEY_NAME = "morphoscan_encryption_key";

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const testKey = "__encryption_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// In-memory fallback for encryption key
let memoryKey: CryptoKey | null = null;

async function getOrCreateKey(): Promise<CryptoKey> {
  // Try to use existing memory key first
  if (memoryKey) return memoryKey;

  // Try localStorage if available
  if (isLocalStorageAvailable()) {
    try {
      const storedKey = localStorage.getItem(ENCRYPTION_KEY_NAME);

      if (storedKey) {
        const keyData = JSON.parse(storedKey);
        memoryKey = await crypto.subtle.importKey(
          "jwk",
          keyData,
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"],
        );
        return memoryKey;
      }
    } catch {
      // Fall through to generate new key
    }
  }

  // Generate new key
  memoryKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);

  // Try to persist key
  if (isLocalStorageAvailable()) {
    try {
      const exportedKey = await crypto.subtle.exportKey("jwk", memoryKey);
      localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));
    } catch {
      // Key will only exist in memory
    }
  }

  return memoryKey;
}

export async function encryptData(data: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encryptedData = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encodedData);

  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encryptedString: string): Promise<string> {
  try {
    const key = await getOrCreateKey();
    const combined = new Uint8Array(
      atob(encryptedString)
        .split("")
        .map(c => c.charCodeAt(0)),
    );

    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData);

    return new TextDecoder().decode(decryptedData);
  } catch {
    // If decryption fails, return empty string (data might be corrupted or unencrypted)
    return "";
  }
}

export function isEncrypted(data: string): boolean {
  try {
    const decoded = atob(data);
    return decoded.length > 12;
  } catch {
    return false;
  }
}
