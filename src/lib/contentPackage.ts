/**
 * Content Package Management
 * Handles downloading, verifying, and installing DLC content packages
 */

import { logger } from "./logger";
import { toast } from "sonner";
import { getDeviceId, getDevicePlatform } from "@/dlc/core/device";
import { fetchDlcKey } from "@/lib/dlcKeys";
import { contentEncryption } from "@/dlc/security";
import { inferPackageIdFromAssetPath, isHttpUrl, signAssetPath } from "@/lib/nsfwAssets";

export interface ContentPackageManifest {
  version: string;
  files: ContentFile[];
  checksum: string;
  size: number;
  releaseDate: string;
  changelog: string[];
}

export interface ContentFile {
  path: string;
  /**
   * Either a direct URL (http/https) OR an `assetPath` that will be signed via `get-dlc-signed-url`.
   * For private DLC storage, prefer `assetPath`.
   */
  url?: string;
  assetPath?: string;
  /**
   * If true, the fetched asset is expected to be stored as an encrypted JSON blob (AES-GCM)
   * and will be decrypted locally after entitlement checks (key fetched via `get-dlc-key`).
   *
   * Note: even if this is omitted, we will also treat `Content-Type: application/dlc-encrypted`
   * as encrypted.
   */
  encrypted?: boolean;
  /**
   * MIME type of the decrypted payload (used when decrypting `application/dlc-encrypted` assets).
   * If omitted, we infer from file extension and type.
   */
  mimeType?: string;
  checksum: string;
  size: number;
  type: "image" | "gif" | "video" | "data" | "component";
}

const CONTENT_DB_NAME = "dlc_content";
const CONTENT_DB_VERSION = 2;
const CONTENT_STORE = "files";

function lsKeyManifest(packageId: string): string {
  return `dlc_content_manifest:${packageId}`;
}

function lsKeyVersion(packageId: string): string {
  return `dlc_content_version:${packageId}`;
}

function lsKeyInstalledAt(packageId: string): string {
  return `dlc_content_installed_at:${packageId}`;
}

function normalizeChecksumHex(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^sha256:/, "");
}

function guessMimeType(params: { path: string; declaredType: ContentFile["type"] }): string {
  const p = params.path.toLowerCase();
  if (params.declaredType === "video") {
    if (p.endsWith(".webm")) return "video/webm";
    if (p.endsWith(".mov")) return "video/quicktime";
    return "video/mp4";
  }
  if (params.declaredType === "gif") return "image/gif";
  if (params.declaredType === "image") {
    if (p.endsWith(".webp")) return "image/webp";
    if (p.endsWith(".png")) return "image/png";
    return "image/jpeg";
  }
  if (p.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

async function maybeDecryptFile(params: {
  packageId: string;
  file: ContentFile;
  response: Response;
  bytes: ArrayBuffer;
}): Promise<ArrayBuffer> {
  const contentType = (params.response.headers.get("content-type") || "").toLowerCase();
  const encrypted =
    Boolean(params.file.encrypted) || contentType.includes("application/dlc-encrypted");
  if (!encrypted) return params.bytes;

  const key = await fetchDlcKey({ packageId: params.packageId });
  if (!key) throw new Error("Unable to fetch DLC decryption key");

  const cryptoKey = await contentEncryption.getContentKey(
    params.packageId,
    key.keyId,
    async () => key.keyB64,
  );
  // Stored encrypted assets are JSON-encoded payloads produced by `contentEncryption.encrypt(...)`.
  // We parse then decrypt to raw bytes.
  let encryptedPayload: unknown;
  try {
    const json = await new Response(params.bytes).text();
    encryptedPayload = JSON.parse(json);
  } catch {
    throw new Error("Invalid encrypted asset payload");
  }

  const decrypted = await (
    contentEncryption as unknown as { decrypt: (e: any, k: CryptoKey) => Promise<ArrayBuffer> }
  ).decrypt(encryptedPayload as any, cryptoKey);

  // If callers need a Blob with a specific mimeType they can wrap it later; we store bytes.
  void (
    params.file.mimeType ||
    guessMimeType({ path: params.file.path, declaredType: params.file.type })
  );
  return decrypted;
}

async function resolveContentFileUrl(params: {
  packageId: string;
  file: ContentFile;
  expiresInSeconds?: number;
}): Promise<{ url: string; assetRef: string }> {
  const direct = params.file.url ? String(params.file.url) : "";
  if (direct && isHttpUrl(direct)) return { url: direct, assetRef: direct };

  const assetPath = params.file.assetPath ? String(params.file.assetPath) : "";
  if (!assetPath) {
    throw new Error("Content file missing url/assetPath");
  }

  const inferredPackageId = inferPackageIdFromAssetPath(assetPath);
  // The packageId passed into the installer should match the asset namespace, but we keep this
  // tolerant: use inferred packageId for signing if the file is namespaced differently.
  const signingPackageId = inferredPackageId || params.packageId;

  const deviceId = getDeviceId();
  const devicePlatform = getDevicePlatform();

  const signedUrl = await signAssetPath({
    assetPath,
    packageId: signingPackageId,
    expiresInSeconds: Math.max(60, Math.min(60 * 60, Number(params.expiresInSeconds ?? 900))),
    deviceId,
    devicePlatform,
  });

  return { url: signedUrl, assetRef: assetPath };
}

/**
 * Download content package
 */
export const downloadContentPackage = async (
  packageUrl: string,
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> => {
  try {
    logger.info("Starting content package download", { packageUrl });

    const response = await fetch(packageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (onProgress && contentLength > 0) {
        const progress = (receivedLength / contentLength) * 100;
        onProgress(progress);
      }
    }

    // Combine chunks into single ArrayBuffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    logger.info("Content package downloaded successfully", {
      size: receivedLength,
      packageUrl,
    });

    return { success: true, data: result.buffer };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to download content package", {
      error: errorMessage,
      packageUrl,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Verify package checksum
 */
export const verifyPackageChecksum = async (
  data: ArrayBuffer,
  expectedChecksum: string,
): Promise<boolean> => {
  try {
    // Import crypto for SHA-256 hashing
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const isValid = hashHex === normalizeChecksumHex(expectedChecksum);

    if (!isValid) {
      logger.error("Package checksum verification failed", {
        expected: expectedChecksum,
        actual: hashHex,
      });
    }

    return isValid;
  } catch (error) {
    logger.error("Error verifying package checksum", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
};

/**
 * Extract content package
 */
export const extractContentPackage = async (
  data: ArrayBuffer,
): Promise<{
  success: boolean;
  manifest?: ContentPackageManifest;
  files?: ContentFile[];
  error?: string;
}> => {
  try {
    // Current supported format: a JSON bundle of { manifest, files }.
    // (We intentionally keep this simple and deterministic for integrity verification.)
    const text = new TextDecoder().decode(data);
    const packageData = JSON.parse(text);

    if (!packageData.manifest || !packageData.files) {
      throw new Error("Invalid package format");
    }

    const manifest: ContentPackageManifest = packageData.manifest;
    const files: ContentFile[] = packageData.files;

    logger.info("Content package extracted", {
      version: manifest.version,
      fileCount: files.length,
    });

    return { success: true, manifest, files };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to extract content package", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

/**
 * Install content package
 */
export const installContentPackage = async (
  packageId: string,
  manifest: ContentPackageManifest,
  files: ContentFile[],
): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info("Installing content package", { version: manifest.version });

    // Store manifest
    localStorage.setItem(lsKeyManifest(packageId), JSON.stringify(manifest));

    // Download and store files
    const filePromises = files.map(async file => {
      try {
        const resolved = await resolveContentFileUrl({ packageId, file });
        const response = await fetch(resolved.url);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${file.path}`);
        }

        const fetchedBytes = await response.arrayBuffer();
        const arrayBuffer = await maybeDecryptFile({
          packageId,
          file,
          response,
          bytes: fetchedBytes,
        });

        // Verify file checksum
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        if (hashHex !== normalizeChecksumHex(file.checksum)) {
          throw new Error(`Checksum mismatch for file: ${file.path}`);
        }

        // Store file in IndexedDB or cache
        await storeContentFile({ packageId, path: file.path, data: arrayBuffer });

        logger.info("File installed", { packageId, path: file.path, assetRef: resolved.assetRef });
      } catch (error) {
        logger.error("Failed to install file", {
          path: file.path,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    });

    await Promise.all(filePromises);

    // Update installed version
    localStorage.setItem(lsKeyVersion(packageId), manifest.version);
    localStorage.setItem(lsKeyInstalledAt(packageId), new Date().toISOString());

    logger.info("Content package installed successfully", { version: manifest.version });
    toast.success("DLC content installed successfully!");

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to install content package", { error: errorMessage });
    toast.error("Failed to install content package");
    return { success: false, error: errorMessage };
  }
};

/**
 * Store content file in IndexedDB
 */
const storeContentFile = async (params: {
  packageId: string;
  path: string;
  data: ArrayBuffer;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CONTENT_DB_NAME, CONTENT_DB_VERSION);
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([CONTENT_STORE], "readwrite");
      const store = transaction.objectStore(CONTENT_STORE);
      const key = `${params.packageId}|${params.path}`;
      const putRequest = store.put({
        key,
        packageId: params.packageId,
        path: params.path,
        data: params.data,
        timestamp: Date.now(),
      });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(new Error("Failed to store file"));
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE, { keyPath: "key" });
      }
    };
  });
};

/**
 * Get installed content version
 */
export const getInstalledContentVersion = (packageId: string): string | null => {
  return localStorage.getItem(lsKeyVersion(packageId));
};

/**
 * Check if content is installed
 */
export const isContentInstalled = (packageId: string): boolean => {
  return !!localStorage.getItem(lsKeyInstalledAt(packageId));
};

/**
 * Get content file from storage
 */
export const getContentFile = async (params: {
  packageId: string;
  path: string;
}): Promise<ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CONTENT_DB_NAME, CONTENT_DB_VERSION);

    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([CONTENT_STORE], "readonly");
      const store = transaction.objectStore(CONTENT_STORE);
      const key = `${params.packageId}|${params.path}`;
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result.data);
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = () => reject(new Error("Failed to get file"));
    };
  });
};

/**
 * Complete DLC content download and installation flow
 */
export const downloadAndInstallDLC = async (
  packageId: string,
  packageUrl: string,
  expectedChecksum: string,
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; error?: string }> => {
  try {
    toast.info("Downloading DLC content...");

    // Download package
    const downloadResult = await downloadContentPackage(packageUrl, onProgress);
    if (!downloadResult.success || !downloadResult.data) {
      return { success: false, error: downloadResult.error || "Download failed" };
    }

    return await extractAndInstallPackageBytes({
      packageId,
      data: downloadResult.data,
      expectedChecksum,
      onProgress,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("DLC download and installation failed", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

export async function extractAndInstallPackageBytes(params: {
  packageId: string;
  data: ArrayBuffer;
  expectedChecksum: string;
  onProgress?: (progress: number) => void;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify checksum
    toast.info("Verifying package integrity...");
    const isValid = await verifyPackageChecksum(params.data, params.expectedChecksum);
    if (!isValid) {
      return { success: false, error: "Package checksum verification failed" };
    }

    // Extract package
    toast.info("Extracting content...");
    const extractResult = await extractContentPackage(params.data);
    if (!extractResult.success || !extractResult.manifest || !extractResult.files) {
      return { success: false, error: extractResult.error || "Extraction failed" };
    }

    // Install package
    toast.info("Installing content...");
    const installResult = await installContentPackage(
      params.packageId,
      extractResult.manifest,
      extractResult.files,
    );

    return installResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("DLC bundle install failed", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

export async function getInstalledManifest(
  packageId: string,
): Promise<ContentPackageManifest | null> {
  try {
    const raw = localStorage.getItem(lsKeyManifest(packageId));
    if (!raw) return null;
    return JSON.parse(raw) as ContentPackageManifest;
  } catch {
    return null;
  }
}
