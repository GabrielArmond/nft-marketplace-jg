import * as z from 'zod/mini'

import { displayNameSchema, emailSchema, passwordSchema, usernameSchema } from '@/contracts/auth'
import { networkSchema } from '@/contracts/common'

export const profileSchema = z.object({
  id: z.string(),
  email: emailSchema,
  username: z.string(),
  displayName: z.string(),
  bio: z.string(),
  website: z.string(),
  ensName: z.string(),
  avatarUrl: z.nullable(z.string()),
})
export type Profile = z.infer<typeof profileSchema>

export const updateProfileInputSchema = z.object({
  displayName: z.optional(displayNameSchema),
  username: z.optional(usernameSchema),
  bio: z.optional(z.string().check(z.maxLength(280, 'Use até 280 caracteres.'))),
  website: z.optional(z.string().check(z.maxLength(120, 'Use até 120 caracteres.'))),
  ensName: z.optional(z.string().check(z.maxLength(64, 'Use até 64 caracteres.'))),
})
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>

/** Small data URLs are enough here: a real API would take an upload. */
export const AVATAR_MAX_LENGTH = 200_000

export const updateAvatarInputSchema = z.object({
  dataUrl: z
    .string('Selecione uma imagem.')
    .check(
      z.regex(/^data:image\/(png|jpeg|webp);base64,/, 'Use uma imagem PNG, JPEG ou WebP.'),
      z.maxLength(AVATAR_MAX_LENGTH, 'A imagem é muito grande.'),
    ),
})
export type UpdateAvatarInput = z.infer<typeof updateAvatarInputSchema>

export const changePasswordInputSchema = z.object({
  currentPassword: z.string('Informe a senha atual.').check(z.minLength(1, 'Informe a senha atual.')),
  newPassword: passwordSchema,
})
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>

export const WALLET_ROLES = ['primary', 'secondary'] as const
export const walletRoleSchema = z.enum(WALLET_ROLES)
export type WalletRole = z.infer<typeof walletRoleSchema>

export const WALLET_TYPES = ['metamask', 'coinbase', 'walletconnect'] as const
export const walletTypeSchema = z.enum(WALLET_TYPES)
export type WalletType = z.infer<typeof walletTypeSchema>

export const walletSchema = z.object({
  id: z.string(),
  role: walletRoleSchema,
  label: z.string(),
  type: walletTypeSchema,
  network: networkSchema,
  address: z.string(),
  ensName: z.string(),
  connected: z.boolean(),
})
export type Wallet = z.infer<typeof walletSchema>

export const walletListSchema = z.object({ items: z.array(walletSchema) })
export type WalletList = z.infer<typeof walletListSchema>

const addressSchema = z
  .string('Informe o endereço da carteira.')
  .check(z.regex(/^0x[0-9a-fA-F]{40}$/, 'Use um endereço 0x com 40 caracteres hexadecimais.'))

const walletFields = {
  label: z.string('Informe o apelido.').check(z.trim(), z.minLength(1, 'Informe o apelido.'), z.maxLength(40)),
  type: walletTypeSchema,
  network: networkSchema,
  address: addressSchema,
  ensName: z.optional(z.string().check(z.maxLength(64, 'Use até 64 caracteres.'))),
}

export const createWalletInputSchema = z.object({ role: walletRoleSchema, ...walletFields })
export type CreateWalletInput = z.infer<typeof createWalletInputSchema>

export const updateWalletInputSchema = z.partial(z.object(walletFields))
export type UpdateWalletInput = z.infer<typeof updateWalletInputSchema>
