import {
  sessionSchema,
  sessionStateSchema,
  type LoginInput,
  type RegisterInput,
  type Session,
} from '@/contracts/auth'
import { requestJson, requestVoid, type RequestOptions } from '@/lib/http/request'

export function register(input: RegisterInput): Promise<Session> {
  return requestJson(sessionSchema, { method: 'POST', url: '/auth/register', data: input })
}

export function login(input: LoginInput): Promise<Session> {
  return requestJson(sessionSchema, { method: 'POST', url: '/auth/login', data: input })
}

/** `null` for a visitor. A session that ended rejects with a 401 `ApiError`. */
export async function getSession(options?: RequestOptions): Promise<Session | null> {
  const state = await requestJson(sessionStateSchema, { url: '/auth/session', ...options })
  return state.user ? state : null
}

export function logout(): Promise<void> {
  return requestVoid({ method: 'POST', url: '/auth/logout' })
}
