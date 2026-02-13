import { logger } from "@/lib/logger";

type ContentRow = {
  packageId: string;
  data: Uint8Array;
  downloadedAt: string;
  size: number;
};

export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dlc_download_manager", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("content")) {
        db.createObjectStore("content", { keyPath: "packageId" });
      }
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "packageId" });
      }
    };
  });
}

export async function storeContent(packageId: string, data: ArrayBuffer): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(["content"], "readwrite");
  const store = tx.objectStore("content");
  await new Promise<void>((resolve, reject) => {
    const request = store.put({
      packageId,
      data: new Uint8Array(data),
      downloadedAt: new Date().toISOString(),
      size: data.byteLength,
    } satisfies ContentRow);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  logger.debug("DownloadManager: Content stored", { packageId, size: data.byteLength });
}

export async function isContentCached(packageId: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(["content"], "readonly");
    const store = tx.objectStore("content");
    return await new Promise<boolean>(resolve => {
      const request = store.get(packageId);
      request.onsuccess = () => resolve(Boolean(request.result));
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function getCachedContent(packageId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(["content"], "readonly");
    const store = tx.objectStore("content");
    return await new Promise<ArrayBuffer | null>(resolve => {
      const request = store.get(packageId);
      request.onsuccess = () => {
        const row = request.result as ContentRow | undefined;
        const buffer = row?.data?.buffer;
        resolve(buffer ? (buffer as ArrayBuffer) : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteCachedContent(packageId: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(["content"], "readwrite");
  const store = tx.objectStore("content");
  await new Promise<void>((resolve, reject) => {
    const request = store.delete(packageId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  logger.debug("DownloadManager: Cached content deleted", { packageId });
}

export async function getCacheSize(): Promise<number> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(["content"], "readonly");
    const store = tx.objectStore("content");
    return await new Promise<number>(resolve => {
      let totalSize = 0;
      const request = store.openCursor();
      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          totalSize += Number(cursor.value.size || 0);
          cursor.continue();
        } else {
          resolve(totalSize);
        }
      };
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}
