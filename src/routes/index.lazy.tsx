import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router'

import { HomePage } from '@/features/catalog/pages/home-page'

const routeApi = getRouteApi('/')

export const Route = createLazyFileRoute('/')({
  component: function HomeRouteComponent() {
    return <HomePage search={routeApi.useSearch()} />
  },
})
