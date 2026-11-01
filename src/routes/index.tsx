import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/features/catalog/pages/home-page'
import { validateCatalogSearch } from '@/features/catalog/search-params'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  component: function HomeRoute() {
    return <HomePage search={Route.useSearch()} />
  },
})
