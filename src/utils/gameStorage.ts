import type { CustomGame } from '../types/classroom';

const DB_NAME = 'tho_may_317_games_db';
const STORE_NAME = 'games';
const FALLBACK_KEY = 'tho_may_317_custom_games_v2';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
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

export async function loadCustomGames(): Promise<CustomGame[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as CustomGame[]) ?? [];
        list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(FALLBACK_KEY);
      return raw ? (JSON.parse(raw) as CustomGame[]) : [];
    } catch {
      return [];
    }
  }
}

export async function persistCustomGames(games: CustomGame[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const g of games) {
        store.put(g);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(games));
      } catch {
        // Ignore quota exceeded
      }
    }
  }
}
