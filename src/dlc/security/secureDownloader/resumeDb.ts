import {
  RESUME_CHUNKS_STORE,
  RESUME_DB_NAME,
  RESUME_DB_VERSION,
  RESUME_META_STORE,
} from "./constants";

export type ResumeMeta = {
  packageId: string;
  url: string;
  totalBytes: number;
  chunkSize: number;
  createdAt: number;
};

export async function openResumeDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RESUME_DB_NAME, RESUME_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(RESUME_META_STORE)) {
        db.createObjectStore(RESUME_META_STORE, { keyPath: "packageId" });
      }
      if (!db.objectStoreNames.contains(RESUME_CHUNKS_STORE)) {
        db.createObjectStore(RESUME_CHUNKS_STORE, { keyPath: "key" });
      }
    };
  });
}

export async function loadResumeMeta(packageId: string): Promise<ResumeMeta | null> {
  try {
    const db = await openResumeDb();
    const tx = db.transaction([RESUME_META_STORE], "readonly");
    const store = tx.objectStore(RESUME_META_STORE);
    return await new Promise(resolve => {
      const req = store.get(packageId);
      req.onsuccess = () => resolve((req.result ?? null) as ResumeMeta | null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveResumeMeta(meta: ResumeMeta): Promise<void> {
  const db = await openResumeDb();
  const tx = db.transaction([RESUME_META_STORE], "readwrite");
  const store = tx.objectStore(RESUME_META_STORE);
  await new Promise<void>((resolve, reject) => {
    const req = store.put(meta);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveChunk(
  packageId: string,
  chunkIndex: number,
  bytes: Uint8Array,
): Promise<void> {
  const db = await openResumeDb();
  const tx = db.transaction([RESUME_CHUNKS_STORE], "readwrite");
  const store = tx.objectStore(RESUME_CHUNKS_STORE);
  const key = `${packageId}:${chunkIndex}`;
  await new Promise<void>((resolve, reject) => {
    const req = store.put({
      key,
      packageId,
      chunkIndex,
      bytes,
      size: bytes.byteLength,
      savedAt: Date.now(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadChunk(packageId: string, chunkIndex: number): Promise<Uint8Array | null> {
  try {
    const db = await openResumeDb();
    const tx = db.transaction([RESUME_CHUNKS_STORE], "readonly");
    const store = tx.objectStore(RESUME_CHUNKS_STORE);
    const key = `${packageId}:${chunkIndex}`;
    return await new Promise(resolve => {
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result?.bytes ?? null) as Uint8Array | null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearResume(packageId: string): Promise<void> {
  try {
    const db = await openResumeDb();
    const tx = db.transaction([RESUME_META_STORE, RESUME_CHUNKS_STORE], "readwrite");
    const metaStore = tx.objectStore(RESUME_META_STORE);
    const chunkStore = tx.objectStore(RESUME_CHUNKS_STORE);

    metaStore.delete(packageId);

    await new Promise<void>(resolve => {
      const req = chunkStore.openCursor();
      req.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;
        if (!cursor) return resolve();
        const key = String(cursor.value?.key ?? "");
        if (key.startsWith(`${packageId}:`)) cursor.delete();
        cursor.continue();
      };
      req.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}
