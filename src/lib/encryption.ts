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

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(b64: string): Uint8Array {
  const raw = atob(String(b64 || ""));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type PassphraseEncryptedPayloadV1 = {
  v: 1;
  kdf: "PBKDF2-SHA256";
  iter: number;
  salt: string; // base64
  iv: string; // base64 (12 bytes)
  ct: string; // base64 ciphertext
};

async function deriveAesKeyFromPassphrase(params: {
  passphrase: string;
  saltBytes: Uint8Array;
  iterations: number;
}): Promise<CryptoKey> {
  const passphraseBytes = new TextEncoder().encode(params.passphrase);
  const baseKey = await crypto.subtle.importKey("raw", passphraseBytes, "PBKDF2", false, [
    "deriveKey",
  ]);
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: params.saltBytes,
      iterations: params.iterations,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt data with a user-supplied passphrase (portable across devices).
 * Produces a JSON payload string (versioned) suitable for storage/upload.
 */
export async function encryptDataWithPassphrase(
  data: string,
  passphrase: string,
  options?: { iterations?: number },
): Promise<string> {
  const plaintext = String(data ?? "");
  const pw = String(passphrase ?? "");
  if (!pw) throw new Error("Missing passphrase");

  const iterations = Number(options?.iterations ?? 150_000);
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKeyFromPassphrase({ passphrase: pw, saltBytes, iterations });
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBytes }, key, encoded);
  const payload: PassphraseEncryptedPayloadV1 = {
    v: 1,
    kdf: "PBKDF2-SHA256",
    iter: iterations,
    salt: bytesToBase64(saltBytes),
    iv: bytesToBase64(ivBytes),
    ct: bytesToBase64(new Uint8Array(encrypted)),
  };
  return JSON.stringify(payload);
}

/**
 * Decrypt data produced by `encryptDataWithPassphrase`.
 */
export async function decryptDataWithPassphrase(
  payload: string,
  passphrase: string,
): Promise<string> {
  const pw = String(passphrase ?? "");
  if (!pw) throw new Error("Missing passphrase");

  let parsed: PassphraseEncryptedPayloadV1 | null = null;
  try {
    parsed = JSON.parse(String(payload || "")) as PassphraseEncryptedPayloadV1;
  } catch {
    throw new Error("Invalid encrypted payload");
  }

  if (!parsed || parsed.v !== 1 || parsed.kdf !== "PBKDF2-SHA256") {
    throw new Error("Unsupported encrypted payload");
  }

  const iterations = Number(parsed.iter || 0);
  if (!iterations || iterations < 10_000) {
    throw new Error("Invalid encrypted payload (iterations)");
  }

  const saltBytes = base64ToBytes(parsed.salt);
  const ivBytes = base64ToBytes(parsed.iv);
  const ctBytes = base64ToBytes(parsed.ct);

  if (saltBytes.length < 8 || ivBytes.length !== 12 || ctBytes.length < 1) {
    throw new Error("Invalid encrypted payload (sizes)");
  }

  try {
    const key = await deriveAesKeyFromPassphrase({ passphrase: pw, saltBytes, iterations });
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, ctBytes);
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Invalid passphrase or corrupted data");
  }
}
