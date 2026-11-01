import { createFileRoute } from '@tanstack/react-router'

import { NftPlaceholderPage } from '@/features/catalog/pages/nft-placeholder-page'

export const Route = createFileRoute('/nft/$id')({
  component: function NftRoute() {
    return <NftPlaceholderPage id={Route.useParams().id} />
  },
})
