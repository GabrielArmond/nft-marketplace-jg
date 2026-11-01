import type { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import type { OrderUpdatedEvent } from '@/contracts/events'
import type { Order } from '@/contracts/orders'
import { createEventGate } from '@/lib/realtime/event-gate'
import { onOrderUpdated, onRealtimeConnect } from '@/lib/realtime/socket-client'

function applyToCache(queryClient: QueryClient, event: OrderUpdatedEvent): void {
  const { id } = event.resource
  const { status, refusalReason } = event.data

  // REST and events race: the cached copy may already be newer than this event.
  queryClient.setQueryData<Order>(queryKeys.order(id), (order) =>
    order && event.version > order.version
      ? { ...order, status, refusalReason, version: event.version }
      : order,
  )

  if (status === 'pending') return

  // The event has no receipt, and settling also moves the cart and the stock.
  void queryClient.invalidateQueries({ queryKey: queryKeys.orders })
  void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
  void queryClient.invalidateQueries({ queryKey: queryKeys.nfts })
}

/** Keeps orders current. Returns the function that stops it. */
export function startOrderRealtimeSync(queryClient: QueryClient): () => void {
  const gate = createEventGate()
  let hasConnected = false

  const stopEvents = onOrderUpdated((event) => {
    if (gate.accept(event)) applyToCache(queryClient, event)
  })

  const stopReconcile = onRealtimeConnect(() => {
    if (!hasConnected) {
      hasConnected = true
      return
    }

    // Events are not replayed after a drop: an order may have settled meanwhile.
    gate.reset()
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders })
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
  })

  return () => {
    stopEvents()
    stopReconcile()
  }
}
