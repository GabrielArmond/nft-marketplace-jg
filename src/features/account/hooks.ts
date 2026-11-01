import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import type {
  ChangePasswordInput,
  CreateWalletInput,
  Profile,
  UpdateProfileInput,
  UpdateWalletInput,
  Wallet,
  WalletList,
} from '@/contracts/account'
import type { Session } from '@/contracts/auth'
import {
  changePassword,
  connectWallet,
  createWallet,
  disconnectWallet,
  removeAvatar,
  setPrimaryWallet,
  updateAvatar,
  updateProfile,
  updateWallet,
} from '@/features/account/api'

/** The session feeds the header: it must follow the profile without a reload. */
function applyProfile(queryClient: QueryClient, profile: Profile): void {
  const { displayName, username, avatarUrl } = profile

  queryClient.setQueryData(queryKeys.profile, profile)
  queryClient.setQueryData<Session | null>(queryKeys.session, (session) =>
    session && { ...session, user: { ...session.user, displayName, username, avatarUrl } },
  )
}

function useProfileMutation<Input>(mutationFn: (input: Input) => Promise<Profile>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (profile) => {
      applyProfile(queryClient, profile)
    },
  })
}

export function useUpdateProfile() {
  return useProfileMutation((input: UpdateProfileInput) => updateProfile(input))
}

export function useUpdateAvatar() {
  return useProfileMutation((dataUrl: string) => updateAvatar({ dataUrl }))
}

export function useRemoveAvatar() {
  return useProfileMutation(() => removeAvatar())
}

export function useChangePassword() {
  return useMutation({ mutationFn: (input: ChangePasswordInput) => changePassword(input) })
}

/** The checkout reads the same list, so every change must land here to reach it. */
function useWalletMutation<Input>(mutationFn: (input: Input) => Promise<Wallet>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (wallet) => {
      queryClient.setQueryData<WalletList>(queryKeys.wallets, (list) =>
        list && { items: list.items.map((item) => (item.id === wallet.id ? wallet : item)) },
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallets }),
  })
}

export function useConnectWallet() {
  return useWalletMutation(connectWallet)
}

export function useDisconnectWallet() {
  return useWalletMutation(disconnectWallet)
}

export function useCreateWallet() {
  return useWalletMutation((input: CreateWalletInput) => createWallet(input))
}

export function useUpdateWallet(id: string) {
  return useWalletMutation((input: UpdateWalletInput) => updateWallet(id, input))
}

export function useSetPrimaryWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setPrimaryWallet,
    onSuccess: (list) => {
      queryClient.setQueryData(queryKeys.wallets, list)
    },
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallets }),
  })
}
