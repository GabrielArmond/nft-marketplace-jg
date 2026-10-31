import { createRouter } from '@tanstack/react-router'

import { queryClient } from '@/app/query-client'
import { NotFoundPage } from '@/components/feedback/not-found-page'
import { RouteErrorPage } from '@/components/feedback/route-error-page'
import { routeTree } from '@/routeTree.gen'

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: RouteErrorPage,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
