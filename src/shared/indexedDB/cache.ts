const DB_NAME = "picaflor-cache";
const STORE_NAME = "entries";
const DB_VERSION = 1;

type CacheRecord<T> = {
  key: string;
  value: T;
  expiresAt: number;
};

type CacheFirstOptions<T> = {
  key: string;
  ttl: number;
  fetcher: () => Promise<T>;
  fallback?: T;
};

const isIndexedDBAvailable = () =>
  typeof window !== "undefined" && "indexedDB" in window;

async function openCacheDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readCache<T>(key: string): Promise<CacheRecord<T> | null> {
  if (!isIndexedDBAvailable()) {
    return null;
  }
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ?? null);
        db.close();
      };
      request.onerror = () => {
        resolve(null);
        db.close();
      };
    });
  } catch (error) {
    console.warn("IndexedDB read failed", error);
    return null;
  }
}

async function writeCache<T>(key: string, value: T, ttl: number) {
  if (!isIndexedDBAvailable()) {
    return;
  }
  if (ttl <= 0) {
    return;
  }
  try {
    const db = await openCacheDB();
    return new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const record: CacheRecord<T> = {
        key,
        value,
        expiresAt: Date.now() + ttl,
      };
      const request = store.put(record);
      request.onsuccess = () => {
        resolve();
        db.close();
      };
      request.onerror = () => {
        resolve();
        db.close();
      };
    });
  } catch (error) {
    console.warn("IndexedDB write failed", error);
  }
}

export async function cacheFirst<T>({
  key,
  ttl,
  fetcher,
  fallback,
}: CacheFirstOptions<T>) {
  const cached = await readCache<T>(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const fresh = await fetcher();
    await writeCache(key, fresh, ttl);
    return fresh;
  } catch (error) {
    if (cached) {
      return cached.value;
    }
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}
