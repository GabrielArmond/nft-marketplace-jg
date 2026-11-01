import { createFileRoute } from '@tanstack/react-router'

import { FavoritesPage } from '@/features/favorites/pages/favorites-page'

export const Route = createFileRoute('/_private/favoritos')({
  component: FavoritesPage,
})
