import { createFileRoute } from '@tanstack/react-router'

import { UnderConstruction } from '@/components/feedback/under-construction'

export const Route = createFileRoute('/aprenda')({
  component: function LearnRoute() {
    return <UnderConstruction title="Aprenda" />
  },
})
