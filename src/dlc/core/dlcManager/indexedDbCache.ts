import { logger } from "@/lib/logger";

export async function clearPackageCache(packageId: string): Promise<void> {
  // Clear from localStorage
  const cacheKeys = Object.keys(localStorage).filter(key =>
    key.startsWith(`dlc_cache_${packageId}`),
  );
  cacheKeys.forEach(key => localStorage.removeItem(key));

  if (!("indexedDB" in window)) return;

  try {
    const db = await openCacheDB();
    const tx = db.transaction(["dlc_content"], "readwrite");
    const store = tx.objectStore("dlc_content");

    const index = store.index("packageId");
    const request = index.openCursor(IDBKeyRange.only(packageId));
    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    logger.warn("DLCManager: Failed to clear IndexedDB cache", { error });
  }
}

export function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dlc_cache", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("dlc_content")) {
        const store = db.createObjectStore("dlc_content", { keyPath: "id" });
        store.createIndex("packageId", "packageId", { unique: false });
      }
    };
  });
}
