import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import { getProfile, listWallets } from '@/features/account/api'

export const profileQueryOptions = queryOptions({
  queryKey: queryKeys.profile,
  queryFn: ({ signal }) => getProfile({ signal }),
})

export const walletsQueryOptions = queryOptions({
  queryKey: queryKeys.wallets,
  queryFn: ({ signal }) => listWallets({ signal }),
})
