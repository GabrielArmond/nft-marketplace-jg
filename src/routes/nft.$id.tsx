import { createFileRoute } from '@tanstack/react-router'

import { nftDetailQueryOptions } from '@/features/catalog/queries'
import { NftDetailSkeleton } from '@/features/nft/components/nft-detail-skeleton'

export const Route = createFileRoute('/nft/$id')({
  loader: ({ context, params }) => {
    // Start fetching as soon as the route matches; useQuery shares this request.
    void context.queryClient
      .query(nftDetailQueryOptions(params.id))
      .catch(() => undefined)
  },
  pendingComponent: NftDetailSkeleton,
})
