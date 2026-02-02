const DB_NAME = "morphoscan";
const DB_VERSION = 1;
const STORE = "kv";

const KEY_BLOB = "customWallpaperBlob";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export async function getCustomWallpaperBlob(): Promise<Blob | null> {
  try {
    const result = await withStore<Blob | undefined>("readonly", store => store.get(KEY_BLOB));
    return result ?? null;
  } catch {
    return null;
  }
}

export async function setCustomWallpaperBlob(blob: Blob): Promise<void> {
  await withStore<IDBValidKey>("readwrite", store => store.put(blob, KEY_BLOB));
}

export async function clearCustomWallpaperBlob(): Promise<void> {
  try {
    await withStore<void>("readwrite", store => store.delete(KEY_BLOB));
  } catch {
    // ignore
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",", 2);
  if (!meta || !base64) throw new Error("Invalid data URL");
  const mime = meta.match(/data:([^;]+);base64/)?.[1] ?? "application/octet-stream";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
