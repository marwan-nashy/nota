// Local-first IndexedDB storage for offline images and voice memos

const DB_NAME = 'nota_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredMedia {
  id: string;
  type: 'image' | 'audio';
  dataUrl: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: number;
}

export async function storeMediaItem(item: StoredMedia): Promise<string> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve(item.id);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to store media in IndexedDB, fallback to in-memory', err);
    return item.id;
  }
}

export async function getMediaItem(id: string): Promise<StoredMedia | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteMediaItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch {}
}
