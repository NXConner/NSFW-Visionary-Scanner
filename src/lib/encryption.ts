// Simple encryption using Web Crypto API for local storage data
const ENCRYPTION_KEY_NAME = 'morphoscan_encryption_key';

async function getOrCreateKey(): Promise<CryptoKey> {
  const storedKey = localStorage.getItem(ENCRYPTION_KEY_NAME);
  
  if (storedKey) {
    const keyData = JSON.parse(storedKey);
    return await crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));
  
  return key;
}

export async function encryptData(data: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );
  
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encryptedString: string): Promise<string> {
  try {
    const key = await getOrCreateKey();
    const combined = new Uint8Array(
      atob(encryptedString).split('').map(c => c.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    
    return new TextDecoder().decode(decryptedData);
  } catch {
    // If decryption fails, return empty string (data might be corrupted or unencrypted)
    return '';
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
