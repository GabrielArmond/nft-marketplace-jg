import { createFileRoute } from '@tanstack/react-router'

import { UnderConstruction } from '@/components/feedback/under-construction'

export const Route = createFileRoute('/criadores')({
  component: function CreatorsRoute() {
    return <UnderConstruction title="Criadores" />
  },
})
