import * as z from 'zod/mini'

import { WALLET_TYPES } from '@/contracts/account'
import { displayNameSchema, usernameSchema } from '@/contracts/auth'
import { NETWORKS } from '@/contracts/common'

export const ENS_SUFFIXES = ['.eth'] as const

function hasPassword({ currentPassword, newPassword, confirmPassword }: PasswordFields): boolean {
  return Boolean(currentPassword || newPassword || confirmPassword)
}

interface PasswordFields {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/** Every password field is optional until one of them is filled. */
export const profileFormSchema = z
  .object({
    displayName: displayNameSchema,
    username: usernameSchema,
    email: z.string(),
    ensName: z
      .string()
      .check(z.trim(), z.regex(/^$|^[a-z0-9][a-z0-9-]*$/, 'Use letras minúsculas, números ou hífen.')),
    ensSuffix: z.enum(ENS_SUFFIXES),
    walletLabel: z.string().check(z.trim(), z.maxLength(40, 'Use até 40 caracteres.')),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .check(
    z.refine((values) => !hasPassword(values) || values.currentPassword.length > 0, {
      path: ['currentPassword'],
      error: 'Informe a senha atual.',
    }),
    z.refine((values) => !hasPassword(values) || values.newPassword.length >= 8, {
      path: ['newPassword'],
      error: 'A senha precisa de ao menos 8 caracteres.',
    }),
    z.refine((values) => values.newPassword === values.confirmPassword, {
      path: ['confirmPassword'],
      error: 'As senhas não coincidem.',
    }),
  )
export type ProfileFormValues = z.infer<typeof profileFormSchema>

export const walletFormSchema = z.object({
  label: z
    .string('Informe o apelido.')
    .check(z.trim(), z.minLength(1, 'Informe o apelido.'), z.maxLength(40, 'Use até 40 caracteres.')),
  network: z.enum(NETWORKS, 'Selecione uma rede.'),
  type: z.enum(WALLET_TYPES, 'Selecione uma carteira.'),
  address: z
    .string()
    .check(
      z.trim(),
      z.regex(/^0x[0-9a-fA-F]{40}$/, 'Use um endereço 0x com 40 caracteres hexadecimais.'),
    ),
  ensName: z.string().check(z.trim(), z.maxLength(64, 'Use até 64 caracteres.')),
})
export type WalletFormValues = z.infer<typeof walletFormSchema>
