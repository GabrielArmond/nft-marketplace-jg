import { HttpResponse } from 'msw'

import { loginInputSchema, registerInputSchema } from '@/contracts/auth'
import { API_ERROR_CODES } from '@/contracts/common'
import { getDb } from '@/mocks/db/store'
import {
  createPasswordSalt,
  endSession,
  getSession,
  hashPassword,
  startSession,
  verifyPassword,
} from '@/mocks/domain/auth'
import { mergeGuestCartInto } from '@/mocks/domain/cart'
import { nextId } from '@/mocks/domain/clock'
import { invalidFields, MockHttpError } from '@/mocks/domain/errors'
import { noContent, readBody, route } from '@/mocks/handlers/route'

export const authHandlers = [
  route('post', '/auth/register', async ({ request }) => {
    const input = await readBody(request, registerInputSchema)
    const db = getDb()
    const email = input.email.toLowerCase()

    if (db.users.some((user) => user.email === email)) {
      throw new MockHttpError(409, API_ERROR_CODES.emailTaken, 'Este e-mail já está cadastrado.', {
        email: ['Este e-mail já está cadastrado.'],
      })
    }
    if (db.users.some((user) => user.username === input.username)) {
      throw new MockHttpError(409, API_ERROR_CODES.usernameTaken, 'Este usuário já existe.', {
        username: ['Este nome de usuário já existe.'],
      })
    }

    const passwordSalt = createPasswordSalt()
    const user = {
      id: nextId('usr'),
      email,
      username: input.username,
      displayName: input.displayName,
      bio: '',
      website: '',
      ensName: '',
      avatarUrl: null,
      passwordSalt,
      passwordHash: await hashPassword(passwordSalt, input.password),
    }

    db.users.push(user)
    const session = startSession(user)
    mergeGuestCartInto(user.id)
    return HttpResponse.json(session, { status: 201 })
  }),

  // Wrong credentials are 422, not 401: 401 means "your session ended" to the client.
  route('post', '/auth/login', async ({ request }) => {
    const input = await readBody(request, loginInputSchema)
    const user = getDb().users.find(({ email }) => email === input.email.toLowerCase())

    if (!user || !(await verifyPassword(user, input.password))) {
      throw invalidFields(
        { password: ['E-mail ou senha incorretos.'] },
        API_ERROR_CODES.invalidCredentials,
        'E-mail ou senha incorretos.',
      )
    }

    const session = startSession(user)
    mergeGuestCartInto(user.id)
    return HttpResponse.json(session)
  }),

  route('get', '/auth/session', () => HttpResponse.json(getSession())),

  route('post', '/auth/logout', () => {
    endSession()
    return noContent()
  }),
]
