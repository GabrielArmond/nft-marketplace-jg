import type { Session, User } from '@/contracts/auth'
import { API_ERROR_CODES } from '@/contracts/common'
import { getDb } from '@/mocks/db/store'
import type { SessionRecord, UserRecord } from '@/mocks/db/types'
import { nowMs } from '@/mocks/domain/clock'
import { MockHttpError } from '@/mocks/domain/errors'

const SESSION_COOKIE = 'kurio_session'
const GUEST_COOKIE = 'kurio_guest'
const SESSION_TTL_MS = 60 * 60_000

/**
 * Handlers run in the page, so the simulated server reaches the cookie directly.
 * A real server would send `Set-Cookie` with `HttpOnly`, out of JavaScript's
 * reach; the client contract is the same: it never sees the session value.
 */
function readCookie(name: string): string | null {
  for (const part of document.cookie.split('; ')) {
    const [key, value] = part.split('=')
    if (key === name && value) return value
  }
  return null
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; Max-Age=0`
}

export function clearAuthCookies(): void {
  clearCookie(SESSION_COOKIE)
  clearCookie(GUEST_COOKIE)
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function hashPassword(salt: string, password: string): Promise<string> {
  return sha256(`${salt}:${password}`)
}

export async function verifyPassword(user: UserRecord, password: string): Promise<boolean> {
  return (await hashPassword(user.passwordSalt, password)) === user.passwordHash
}

export function createPasswordSalt(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 16)
}

export function toUser({ id, email, username, displayName, avatarUrl }: UserRecord): User {
  return { id, email, username, displayName, avatarUrl }
}

function toSession(user: UserRecord, record: SessionRecord): Session {
  return { user: toUser(user), expiresAt: new Date(record.expiresAtMs).toISOString() }
}

export function startSession(user: UserRecord): Session {
  const record: SessionRecord = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAtMs: nowMs() + SESSION_TTL_MS,
  }
  getDb().sessions.push(record)
  writeCookie(SESSION_COOKIE, record.token)
  return toSession(user, record)
}

export function endSession(): void {
  const token = readCookie(SESSION_COOKIE)
  const db = getDb()
  db.sessions = db.sessions.filter((session) => session.token !== token)
  clearCookie(SESSION_COOKIE)
}

export function hasSessionCookie(): boolean {
  return readCookie(SESSION_COOKIE) !== null
}

function findActiveRecord(): SessionRecord | undefined {
  const token = readCookie(SESSION_COOKIE)
  return getDb().sessions.find(
    (session) => session.token === token && session.expiresAtMs > nowMs(),
  )
}

export function currentUserId(): string | null {
  return findActiveRecord()?.userId ?? null
}

/** Enforces the session of a private resource. */
export function requireUser(): UserRecord {
  const token = readCookie(SESSION_COOKIE)
  if (!token) {
    throw new MockHttpError(401, API_ERROR_CODES.sessionInvalid, 'Entre para continuar.')
  }

  const record = findActiveRecord()
  const user = getDb().users.find(({ id }) => id === record?.userId)
  if (!user) {
    throw new MockHttpError(401, API_ERROR_CODES.sessionExpired, 'Sua sessão expirou.')
  }
  return user
}

export function getSession(): Session {
  const user = requireUser()
  const record = findActiveRecord()
  if (!record) throw new MockHttpError(401, API_ERROR_CODES.sessionExpired, 'Sua sessão expirou.')
  return toSession(user, record)
}

/** Expires the caller's session while keeping the cookie, as a real expiry would. */
export function expireCurrentSession(): void {
  const token = readCookie(SESSION_COOKIE)
  const record = getDb().sessions.find((session) => session.token === token)
  if (record) record.expiresAtMs = nowMs() - 1
}

/** Identifies a cart: the signed-in user, or the visitor's own token. */
export function guestToken(): string | null {
  return readCookie(GUEST_COOKIE)
}

export function ensureGuestToken(): string {
  const existing = guestToken()
  if (existing) return existing

  const token = crypto.randomUUID()
  writeCookie(GUEST_COOKIE, token)
  return token
}

export function clearGuestToken(): void {
  clearCookie(GUEST_COOKIE)
}
