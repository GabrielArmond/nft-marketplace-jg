import * as z from 'zod/mini'

import { emailSchema, loginInputSchema, passwordSchema, usernameSchema } from '@/contracts/auth'

export const loginFormSchema = loginInputSchema
export type LoginFormValues = z.infer<typeof loginFormSchema>

/** The layout asks for no display name: it starts as the username and is editable in the profile. */
export const registerFormSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string('Confirme a senha.'),
  })
  .check(
    z.refine(({ password, confirmPassword }) => password === confirmPassword, {
      path: ['confirmPassword'],
      error: 'As senhas não coincidem.',
    }),
  )
export type RegisterFormValues = z.infer<typeof registerFormSchema>
