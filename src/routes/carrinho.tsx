import { createFileRoute } from '@tanstack/react-router'

import { UnderConstruction } from '@/components/feedback/under-construction'

export const Route = createFileRoute('/carrinho')({
  component: function CartRoute() {
    return <UnderConstruction title="Carrinho de NFTs" />
  },
})
