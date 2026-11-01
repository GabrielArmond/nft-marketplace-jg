import { getDb } from '@/mocks/db/store'

/** Server time: the real clock plus the offset set through the control API. */
export function nowMs(): number {
  return Date.now() + getDb().runtime.clockOffsetMs
}

export function nowIso(): string {
  return new Date(nowMs()).toISOString()
}

export function nextId(prefix: string): string {
  const db = getDb()
  const id = `${prefix}_${db.nextId.toString().padStart(4, '0')}`
  db.nextId += 1
  return id
}
