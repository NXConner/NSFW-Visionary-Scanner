import { Capacitor } from "@capacitor/core";

export type VideoQuality = "sd" | "hd" | "2k" | "4k";

export type CachedVideoMeta = {
  key: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

const DB_NAME = "nsfw_media_cache";
const DB_VERSION = 1;
const STORE_VIDEOS = "videos";

const memoryObjectUrls = new Map<string, string>();

function isNative(): boolean {
  return Capacitor.getPlatform() !== "web";
}

function makeKey(videoId: string, quality: VideoQuality): string {
  return `nsfw_video:${videoId}:${quality}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function openDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_VIDEOS)) {
        db.createObjectStore(STORE_VIDEOS, { keyPath: "key" });
      }
    };
  });
}

async function idbPut(meta: CachedVideoMeta, bytes: ArrayBuffer): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_VIDEOS], "readwrite");
    const store = tx.objectStore(STORE_VIDEOS);
    const req = store.put({ ...meta, bytes });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<{ meta: CachedVideoMeta; bytes: ArrayBuffer } | null> {
  const db = await openDb();
  return await new Promise(resolve => {
    const tx = db.transaction([STORE_VIDEOS], "readonly");
    const store = tx.objectStore(STORE_VIDEOS);
    const req = store.get(key);
    req.onsuccess = () => {
      const r = req.result as (CachedVideoMeta & { bytes: ArrayBuffer }) | undefined;
      if (!r) return resolve(null);
      const { bytes, ...rest } = r;
      resolve({ meta: rest as CachedVideoMeta, bytes });
    };
    req.onerror = () => resolve(null);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>(resolve => {
    const tx = db.transaction([STORE_VIDEOS], "readwrite");
    const store = tx.objectStore(STORE_VIDEOS);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

function nativePathForKey(key: string): string {
  // Key is stable and safe for paths.
  return `nsfw/videos/${key}.bin`;
}

export async function cacheVideoBytes(params: {
  videoId: string;
  quality: VideoQuality;
  bytes: ArrayBuffer;
  mimeType?: string;
}): Promise<{ cacheKey: string; meta: CachedVideoMeta }> {
  const cacheKey = makeKey(params.videoId, params.quality);
  const mimeType = params.mimeType ?? "video/mp4";
  const meta: CachedVideoMeta = {
    key: cacheKey,
    mimeType,
    sizeBytes: params.bytes.byteLength,
    createdAt: new Date().toISOString(),
  };

  if (isNative()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const base64 = arrayBufferToBase64(params.bytes);
    await Filesystem.writeFile({
      path: nativePathForKey(cacheKey),
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });
    return { cacheKey, meta };
  }

  await idbPut(meta, params.bytes);
  return { cacheKey, meta };
}

export async function isVideoCached(videoId: string, quality: VideoQuality): Promise<boolean> {
  const key = makeKey(videoId, quality);
  if (isNative()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    try {
      await Filesystem.stat({ path: nativePathForKey(key), directory: Directory.Data });
      return true;
    } catch {
      return false;
    }
  }
  return (await idbGet(key)) !== null;
}

export async function getCachedVideoUrl(
  videoId: string,
  quality: VideoQuality,
): Promise<string | null> {
  const key = makeKey(videoId, quality);

  if (isNative()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    try {
      const { uri } = await Filesystem.getUri({
        path: nativePathForKey(key),
        directory: Directory.Data,
      });
      return Capacitor.convertFileSrc(uri);
    } catch {
      return null;
    }
  }

  const existing = memoryObjectUrls.get(key);
  if (existing) return existing;

  const record = await idbGet(key);
  if (!record) return null;

  const blob = new Blob([record.bytes], { type: record.meta.mimeType || "video/mp4" });
  const url = URL.createObjectURL(blob);
  memoryObjectUrls.set(key, url);
  return url;
}

export async function deleteCachedVideo(videoId: string, quality: VideoQuality): Promise<void> {
  const key = makeKey(videoId, quality);

  const existing = memoryObjectUrls.get(key);
  if (existing) {
    URL.revokeObjectURL(existing);
    memoryObjectUrls.delete(key);
  }

  if (isNative()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    try {
      await Filesystem.deleteFile({ path: nativePathForKey(key), directory: Directory.Data });
    } catch {
      // ignore
    }
    return;
  }

  await idbDelete(key);
}

export async function readCachedVideoBytes(
  videoId: string,
  quality: VideoQuality,
): Promise<ArrayBuffer | null> {
  const key = makeKey(videoId, quality);

  if (isNative()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    try {
      const res = await Filesystem.readFile({
        path: nativePathForKey(key),
        directory: Directory.Data,
      });
      const bytes = base64ToUint8Array(res.data as string);
      return bytes.buffer as ArrayBuffer;
    } catch {
      return null;
    }
  }

  const record = await idbGet(key);
  return record?.bytes ?? null;
}
