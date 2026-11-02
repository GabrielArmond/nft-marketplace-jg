import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router'

import { NftDetailPage } from '@/features/nft/pages/nft-detail-page'

const routeApi = getRouteApi('/nft/$id')

export const Route = createLazyFileRoute('/nft/$id')({
  component: function NftRouteComponent() {
    return <NftDetailPage id={routeApi.useParams().id} />
  },
})
