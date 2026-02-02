/**
 * Convert data URL to Blob using fetch (fast native implementation).
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * Convert Blob to data URL. 
 * Uses URL.createObjectURL for internal operations when possible (faster),
 * but falls back to FileReader when a true data URL is required.
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Create an object URL for a blob (faster than data URL for internal use).
 * Remember to call URL.revokeObjectURL when done.
 */
export function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke an object URL to free memory.
 */
export function revokeObjectUrl(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // Ignore errors
  }
}

