import * as z from 'zod/mini'

import { isoDateTimeSchema } from '@/contracts/common'

const PASSWORD_MIN_LENGTH = 8

export const emailSchema = z.email('Informe um e-mail válido.')
export const passwordSchema = z
  .string('Informe uma senha.')
  .check(z.minLength(PASSWORD_MIN_LENGTH, 'A senha precisa de ao menos 8 caracteres.'))
export const displayNameSchema = z
  .string('Informe o nome de exibição.')
  .check(z.trim(), z.minLength(2, 'O nome precisa de ao menos 2 caracteres.'), z.maxLength(60))
export const usernameSchema = z
  .string('Informe o nome de usuário.')
  .check(
    z.regex(/^[a-z0-9_]{3,24}$/, 'Use de 3 a 24 letras minúsculas, números ou sublinhado.'),
  )

export const userSchema = z.object({
  id: z.string(),
  email: emailSchema,
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.nullable(z.string()),
})
export type User = z.infer<typeof userSchema>

export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: isoDateTimeSchema,
})
export type Session = z.infer<typeof sessionSchema>

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string('Informe sua senha.').check(z.minLength(1, 'Informe sua senha.')),
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const registerInputSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
})
export type RegisterInput = z.infer<typeof registerInputSchema>
