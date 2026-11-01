import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import type { NftListParams } from '@/contracts/nfts'
import { getNft, listNfts } from '@/features/catalog/api'

/**
 * The key is the request, and `signal` aborts it when the parameters change: a slow
 * old response cannot overwrite a newer one. The previous page stays on screen
 * while the next loads, so changing a filter never collapses the layout.
 */
export function nftListQueryOptions(params: NftListParams) {
  return queryOptions({
    queryKey: queryKeys.nftList(params),
    queryFn: ({ signal }) => listNfts(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.nftDetail(id),
    queryFn: ({ signal }) => getNft(id, { signal }),
  })
}
