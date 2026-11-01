import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { LoginInput, RegisterInput } from '@/contracts/auth'
import { login, logout, register } from '@/features/auth/api'
import { replaceSession, sessionQueryOptions } from '@/features/auth/queries'

export function useSession() {
  return useQuery(sessionQueryOptions)
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (session) => replaceSession(queryClient, session),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (session) => replaceSession(queryClient, session),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => replaceSession(queryClient, null),
  })
}
