import { HttpResponse } from 'msw'

import {
  changePasswordInputSchema,
  createWalletInputSchema,
  updateAvatarInputSchema,
  updateProfileInputSchema,
  updateWalletInputSchema,
  type Profile,
  type Wallet,
} from '@/contracts/account'
import { API_ERROR_CODES } from '@/contracts/common'
import { getDb } from '@/mocks/db/store'
import type { UserRecord, WalletRecord } from '@/mocks/db/types'
import { hashPassword, requireUser, verifyPassword } from '@/mocks/domain/auth'
import { nextId } from '@/mocks/domain/clock'
import { invalidFields, MockHttpError, notFound } from '@/mocks/domain/errors'
import { noContent, param, readBody, route } from '@/mocks/handlers/route'

function toProfile(user: UserRecord): Profile {
  const { id, email, username, displayName, bio, website, ensName, avatarUrl } = user
  return { id, email, username, displayName, bio, website, ensName, avatarUrl }
}

function toWallet({ userId: _owner, ...wallet }: WalletRecord): Wallet {
  return wallet
}

/** Another user's wallet answers exactly like a missing one. */
function findOwnWallet(userId: string, walletId: string): WalletRecord {
  const wallet = getDb().wallets.find((item) => item.id === walletId && item.userId === userId)
  if (!wallet) throw notFound('Carteira inexistente.')
  return wallet
}

/** The same address under two roles would make "another wallet" mean nothing. */
function assertAddressIsFree(userId: string, address: string | undefined, walletId?: string): void {
  const taken = getDb().wallets.some(
    (wallet) =>
      wallet.userId === userId &&
      wallet.id !== walletId &&
      wallet.address.toLowerCase() === address?.toLowerCase(),
  )
  if (taken) throw invalidFields({ address: ['Este endereço já está em outra carteira sua.'] })
}

function assertUsernameIsFree(user: UserRecord, username: string | undefined): void {
  const taken = getDb().users.some((other) => other.username === username && other.id !== user.id)
  if (taken) {
    throw new MockHttpError(409, API_ERROR_CODES.usernameTaken, 'Este usuário já existe.', {
      username: ['Este nome de usuário já existe.'],
    })
  }
}

export const accountHandlers = [
  route('get', '/profile', () => HttpResponse.json(toProfile(requireUser()))),

  route('patch', '/profile', async ({ request }) => {
    const user = requireUser()
    const input = await readBody(request, updateProfileInputSchema)

    assertUsernameIsFree(user, input.username)
    Object.assign(user, input)
    return HttpResponse.json(toProfile(user))
  }),

  route('put', '/profile/avatar', async ({ request }) => {
    const user = requireUser()
    const { dataUrl } = await readBody(request, updateAvatarInputSchema)

    user.avatarUrl = dataUrl
    return HttpResponse.json(toProfile(user))
  }),

  route('delete', '/profile/avatar', () => {
    const user = requireUser()

    user.avatarUrl = null
    return HttpResponse.json(toProfile(user))
  }),

  route('put', '/profile/password', async ({ request }) => {
    const user = requireUser()
    const { currentPassword, newPassword } = await readBody(request, changePasswordInputSchema)

    if (!(await verifyPassword(user, currentPassword))) {
      throw invalidFields({ currentPassword: ['A senha atual está incorreta.'] })
    }
    user.passwordHash = await hashPassword(user.passwordSalt, newPassword)
    return noContent()
  }),

  route('get', '/wallets', () => {
    const { id } = requireUser()
    const items = getDb()
      .wallets.filter(({ userId }) => userId === id)
      .map(toWallet)
    return HttpResponse.json({ items })
  }),

  route('post', '/wallets', async ({ request }) => {
    const { id: userId } = requireUser()
    const input = await readBody(request, createWalletInputSchema)
    const db = getDb()

    if (db.wallets.some((wallet) => wallet.userId === userId && wallet.role === input.role)) {
      throw invalidFields({ role: ['Esta posição de carteira já está em uso.'] })
    }
    assertAddressIsFree(userId, input.address)

    const wallet: WalletRecord = {
      ...input,
      id: nextId('wal'),
      userId,
      ensName: input.ensName ?? '',
      connected: false,
    }
    db.wallets.push(wallet)
    return HttpResponse.json(toWallet(wallet), { status: 201 })
  }),

  route('patch', '/wallets/:id', async (context) => {
    const { id: userId } = requireUser()
    const wallet = findOwnWallet(userId, param(context, 'id'))
    const input = await readBody(context.request, updateWalletInputSchema)
    const isOtherAccount =
      (input.address !== undefined && input.address !== wallet.address) ||
      (input.network !== undefined && input.network !== wallet.network) ||
      (input.type !== undefined && input.type !== wallet.type)

    if (input.address !== undefined) assertAddressIsFree(userId, input.address, wallet.id)
    Object.assign(wallet, input)
    // The connection belonged to what the wallet was: the new one must be approved.
    if (isOtherAccount) wallet.connected = false
    return HttpResponse.json(toWallet(wallet))
  }),

  route('post', '/wallets/:id/primary', (context) => {
    const { id: userId } = requireUser()
    const wallet = findOwnWallet(userId, param(context, 'id'))
    const wallets = getDb().wallets.filter((item) => item.userId === userId)

    // A swap, so there is never a moment with two primaries or none.
    for (const item of wallets) item.role = item === wallet ? 'primary' : 'secondary'
    return HttpResponse.json({ items: wallets.map(toWallet) })
  }),

  route('post', '/wallets/:id/connect', (context) => {
    const wallet = findOwnWallet(requireUser().id, param(context, 'id'))

    wallet.connected = true
    return HttpResponse.json(toWallet(wallet))
  }),

  route('post', '/wallets/:id/disconnect', (context) => {
    const wallet = findOwnWallet(requireUser().id, param(context, 'id'))

    wallet.connected = false
    return HttpResponse.json(toWallet(wallet))
  }),
]
