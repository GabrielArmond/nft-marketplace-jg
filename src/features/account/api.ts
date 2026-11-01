import {
  profileSchema,
  walletListSchema,
  walletSchema,
  type ChangePasswordInput,
  type CreateWalletInput,
  type Profile,
  type UpdateAvatarInput,
  type UpdateProfileInput,
  type UpdateWalletInput,
  type Wallet,
  type WalletList,
} from '@/contracts/account'
import { requestJson, requestVoid, type RequestOptions } from '@/lib/http/request'

export function getProfile(options?: RequestOptions): Promise<Profile> {
  return requestJson(profileSchema, { url: '/profile', ...options })
}

export function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  return requestJson(profileSchema, { method: 'PATCH', url: '/profile', data: input })
}

export function updateAvatar(input: UpdateAvatarInput): Promise<Profile> {
  return requestJson(profileSchema, { method: 'PUT', url: '/profile/avatar', data: input })
}

export function removeAvatar(): Promise<Profile> {
  return requestJson(profileSchema, { method: 'DELETE', url: '/profile/avatar' })
}

export function changePassword(input: ChangePasswordInput): Promise<void> {
  return requestVoid({ method: 'PUT', url: '/profile/password', data: input })
}

export function listWallets(options?: RequestOptions): Promise<WalletList> {
  return requestJson(walletListSchema, { url: '/wallets', ...options })
}

export function createWallet(input: CreateWalletInput): Promise<Wallet> {
  return requestJson(walletSchema, { method: 'POST', url: '/wallets', data: input })
}

export function updateWallet(id: string, input: UpdateWalletInput): Promise<Wallet> {
  return requestJson(walletSchema, {
    method: 'PATCH',
    url: `/wallets/${encodeURIComponent(id)}`,
    data: input,
  })
}

export function connectWallet(id: string): Promise<Wallet> {
  return requestJson(walletSchema, {
    method: 'POST',
    url: `/wallets/${encodeURIComponent(id)}/connect`,
  })
}

export function disconnectWallet(id: string): Promise<Wallet> {
  return requestJson(walletSchema, {
    method: 'POST',
    url: `/wallets/${encodeURIComponent(id)}/disconnect`,
  })
}
