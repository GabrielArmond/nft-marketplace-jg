import type { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import type { Cart } from '@/contracts/cart'
import type { NftUpdatedEvent } from '@/contracts/events'
import type { Favorites, NftDetail, NftList, NftSummary } from '@/contracts/nfts'
import { createEventGate } from '@/lib/realtime/event-gate'
import { onNftUpdated, onRealtimeConnect } from '@/lib/realtime/socket-client'

/** The cached copy may already be newer, because REST and events race. */
function patchNft<Nft extends NftSummary>(nft: Nft, event: NftUpdatedEvent): Nft {
  if (event.version <= nft.version) return nft

  const { priceEth, compareAtPriceEth, soldOut } = event.data
  return { ...nft, priceEth, compareAtPriceEth, soldOut, version: event.version }
}

function applyToCache(queryClient: QueryClient, event: NftUpdatedEvent): void {
  const nftId = event.resource.id

  queryClient.setQueriesData<NftList>({ queryKey: queryKeys.nftLists }, (list) =>
    list && {
      ...list,
      items: list.items.map((item) => (item.id === nftId ? patchNft(item, event) : item)),
    },
  )

  queryClient.setQueryData<Favorites>(queryKeys.favorites, (favorites) =>
    favorites && {
      items: favorites.items.map((item) => (item.id === nftId ? patchNft(item, event) : item)),
    },
  )

  queryClient.setQueryData<NftDetail>(queryKeys.nftDetail(nftId), (detail) => {
    if (!detail) return detail

    const patched = patchNft(detail, event)
    return patched === detail ? detail : { ...patched, editions: event.data.editions }
  })

  // A new price can change filters, order and totals: the server decides those.
  void queryClient.invalidateQueries({ queryKey: queryKeys.nftLists, refetchType: 'none' })

  const cart = queryClient.getQueryData<Cart>(queryKeys.cart)
  if (cart?.items.some((item) => item.nftId === nftId)) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
  }
}

/** Keeps catalog, detail and cart caches current. Returns the function that stops it. */
export function startNftRealtimeSync(queryClient: QueryClient): () => void {
  const gate = createEventGate()
  let hasConnected = false

  const stopEvents = onNftUpdated((event) => {
    if (gate.accept(event)) applyToCache(queryClient, event)
  })

  const stopReconcile = onRealtimeConnect(() => {
    // The first connection has nothing to recover: the page was fetched just now.
    if (!hasConnected) {
      hasConnected = true
      return
    }

    // Events are not replayed after a drop: REST is the source of truth from here.
    gate.reset()
    void queryClient.invalidateQueries({ queryKey: queryKeys.nfts })
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
  })

  return () => {
    stopEvents()
    stopReconcile()
  }
}
