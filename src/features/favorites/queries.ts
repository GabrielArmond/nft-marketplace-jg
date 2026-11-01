import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import { listFavorites } from '@/features/favorites/api'

export const favoritesQueryOptions = queryOptions({
  queryKey: queryKeys.favorites,
  queryFn: ({ signal }) => listFavorites({ signal }),
})
