function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64Url(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function randomApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const rand = base64Url(bytes);
  const prefix = rand.slice(0, 8);
  return `pps_${prefix}_${rand}`;
}

export async function sha256Hex(input: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("WebCrypto subtle is not available");
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return toHex(hash);
}
