import { createSeed, DB_SCHEMA_VERSION } from '@/mocks/db/seed'
import type { MockDb, RuntimeState } from '@/mocks/db/types'

const STORAGE_KEY = 'kurio:mock-db'

function isMockDb(value: unknown): value is MockDb {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === DB_SCHEMA_VERSION
  )
}

function readStored(raw: string | null): MockDb | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isMockDb(parsed) ? parsed : null
  } catch (error) {
    console.error('Discarded unreadable mock database.', error)
    return null
  }
}

function load(): MockDb {
  try {
    return readStored(localStorage.getItem(STORAGE_KEY)) ?? createSeed()
  } catch {
    // Storage can be blocked: the session still works, it just will not survive a refresh.
    return createSeed()
  }
}

let db = load()

export function getDb(): MockDb {
  return db
}

export function commit(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (error) {
    console.error('Could not persist the mock database.', error)
  }
}

/** Restores the whole known state: nothing from the previous run survives. */
export function resetDb(runtime?: Partial<RuntimeState>): void {
  db = createSeed(runtime)
  commit()
}

/** Other tabs write the same key: keep this tab's copy current. */
export function syncAcrossTabs(): void {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    db = readStored(event.newValue) ?? createSeed()
  })
}
