const CONTENT_DB_NAME = "dlc_content";
const CONTENT_DB_VERSION = 2;
const CONTENT_STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CONTENT_DB_NAME, CONTENT_DB_VERSION);
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE, { keyPath: "key" });
      }
    };
  });
}

export async function storeContentFile(params: {
  packageId: string;
  path: string;
  data: ArrayBuffer;
}): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
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
  });
}

export async function getContentFile(params: {
  packageId: string;
  path: string;
}): Promise<ArrayBuffer | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_STORE], "readonly");
    const store = transaction.objectStore(CONTENT_STORE);
    const key = `${params.packageId}|${params.path}`;
    const getRequest = store.get(key);
    getRequest.onsuccess = () => {
      if (getRequest.result) resolve(getRequest.result.data);
      else resolve(null);
    };
    getRequest.onerror = () => reject(new Error("Failed to get file"));
  });
}
