/** File contents (photos, documents) in IndexedDB — too big for localStorage. Placeholder for Supabase Storage. */

const DB_NAME = 'zerox-files'
const STORE = 'files'

let opening: Promise<IDBDatabase> | null = null

function openDb() {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      opening = null
      reject(request.error)
    }
  })
  return opening
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const fileStore = {
  put: (id: string, blob: Blob) => run('readwrite', (store) => store.put(blob, id)),
  get: (id: string) => run<Blob | undefined>('readonly', (store) => store.get(id)),
  remove: (id: string) => run('readwrite', (store) => store.delete(id)),
}
