import {
  sessionSchema,
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

export function getSession(options?: RequestOptions): Promise<Session> {
  return requestJson(sessionSchema, { url: '/auth/session', ...options })
}

export function logout(): Promise<void> {
  return requestVoid({ method: 'POST', url: '/auth/logout' })
}
