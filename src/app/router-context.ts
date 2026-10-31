import type { QueryClient } from '@tanstack/react-query'

/** Available to every route `loader` and `beforeLoad`. */
export interface RouterContext {
  queryClient: QueryClient
}
