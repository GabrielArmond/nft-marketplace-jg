import { createFileRoute } from '@tanstack/react-router'

import { UnderConstruction } from '@/components/feedback/under-construction'

export const Route = createFileRoute('/_private/favoritos')({
  component: function FavoritesRoute() {
    return <UnderConstruction title="Lista de interesse" />
  },
})
