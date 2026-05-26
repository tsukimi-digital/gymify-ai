import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'gymify_offline';
const STORE = 'pendingSets';

interface PendingSet {
  id: string;
  sessionId: string;
  payload: unknown;
  timestamp: number;
}

let db: IDBPDatabase | null = null;

async function getDB() {
  if (!db) {
    db = await openDB(DB_NAME, 1, {
      upgrade(database) {
        database.createObjectStore(STORE, { keyPath: 'id' });
      },
    });
  }
  return db;
}

export async function enqueueSet(sessionId: string, payload: unknown): Promise<string> {
  const database = await getDB();
  const id = crypto.randomUUID();
  await database.add(STORE, { id, sessionId, payload, timestamp: Date.now() });
  return id;
}

export async function flushQueue(
  flushFn: (sessionId: string, payload: unknown) => Promise<void>,
): Promise<void> {
  const database = await getDB();
  const all: PendingSet[] = await database.getAll(STORE);
  for (const item of all) {
    try {
      await flushFn(item.sessionId, item.payload);
      await database.delete(STORE, item.id);
    } catch {}
  }
}

export async function getPendingCount(): Promise<number> {
  const database = await getDB();
  return database.count(STORE);
}
