import { createFileRoute } from '@tanstack/react-router'

import { NftDetailPage } from '@/features/nft/pages/nft-detail-page'

export const Route = createFileRoute('/nft/$id')({
  component: function NftRoute() {
    return <NftDetailPage id={Route.useParams().id} />
  },
})
