import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import type { Wallet, WalletList } from '@/contracts/account'
import { connectWallet, disconnectWallet } from '@/features/account/api'

function useWalletMutation(mutationFn: (id: string) => Promise<Wallet>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (wallet) => {
      queryClient.setQueryData<WalletList>(queryKeys.wallets, (list) =>
        list && { items: list.items.map((item) => (item.id === wallet.id ? wallet : item)) },
      )
    },
  })
}

export function useConnectWallet() {
  return useWalletMutation(connectWallet)
}

export function useDisconnectWallet() {
  return useWalletMutation(disconnectWallet)
}
