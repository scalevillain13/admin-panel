import { createSeedDb, type MockDb } from './seed'

const STORAGE_KEY = 'admin-panel-mock-db'

export function getDb(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockDb
  } catch {
    /* ignore */
  }
  const seed = createSeedDb()
  saveDb(seed)
  return seed
}

export function saveDb(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function updateDb(mutate: (db: MockDb) => void) {
  const db = getDb()
  mutate(db)
  saveDb(db)
}

export function resetDb() {
  localStorage.removeItem(STORAGE_KEY)
  return getDb()
}
