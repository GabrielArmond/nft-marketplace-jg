import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import type { Network } from '@/contracts/common'
import { createQuote, getOrder, listOrders } from '@/features/checkout/api'

/** Backup for when the socket is down: events are the fast path, not the only one. */
const PENDING_POLL_MS = 5_000

/**
 * A quote is created on the server, so it is never refetched by itself: a new one
 * comes from a changed key or from an explicit revalidation before confirming.
 */
export function quoteQueryOptions(network: Network, cartSignature: string) {
  return queryOptions({
    queryKey: queryKeys.quote(network, cartSignature),
    queryFn: () => createQuote({ network }),
    staleTime: Infinity,
    gcTime: 0,
  })
}

export function orderQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.order(id),
    queryFn: ({ signal }) => getOrder(id, { signal }),
    // Confirmed and refused are terminal: only a pending order can still change.
    staleTime: ({ state }) => (state.data?.status === 'pending' ? 0 : Infinity),
    refetchInterval: ({ state }) => (state.data?.status === 'pending' ? PENDING_POLL_MS : false),
  })
}

export const ordersQueryOptions = queryOptions({
  queryKey: queryKeys.orderList,
  queryFn: ({ signal }) => listOrders({ signal }),
  staleTime: 0,
})
