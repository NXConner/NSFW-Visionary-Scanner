const CONTENT_DB_NAME = "dlc_content";
const CONTENT_DB_VERSION = 2;
const CONTENT_STORE = "files";

type StoredRow = {
  key: string;
  packageId: string;
  path: string;
  data: ArrayBuffer;
  timestamp: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CONTENT_DB_NAME, CONTENT_DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE, { keyPath: "key" });
      }
    };
  });
}

export async function deletePackageFiles(packageId: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const tx = db.transaction([CONTENT_STORE], "readwrite");
  const store = tx.objectStore(CONTENT_STORE);

  await new Promise<void>(resolve => {
    const req = store.openCursor();
    req.onsuccess = event => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
      if (!cursor) return resolve();
      const row = cursor.value as StoredRow;
      if (typeof row?.key === "string" && row.key.startsWith(`${packageId}|`)) {
        cursor.delete();
      }
      cursor.continue();
    };
    req.onerror = () => resolve();
  });
}

export async function getPackageBytesUsed(packageId?: string): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const db = await openDb();
  const tx = db.transaction([CONTENT_STORE], "readonly");
  const store = tx.objectStore(CONTENT_STORE);

  return await new Promise<number>(resolve => {
    let total = 0;
    const req = store.openCursor();
    req.onsuccess = event => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
      if (!cursor) return resolve(total);
      const row = cursor.value as StoredRow;
      const matches =
        !packageId ||
        (typeof row?.key === "string" && row.key.startsWith(`${packageId}|`)) ||
        row?.packageId === packageId;
      if (matches) {
        try {
          total += row?.data?.byteLength ? Number(row.data.byteLength) : 0;
        } catch {
          // ignore
        }
      }
      cursor.continue();
    };
    req.onerror = () => resolve(total);
  });
}

