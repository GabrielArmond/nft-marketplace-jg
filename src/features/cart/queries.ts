import { queryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import { getCart } from '@/features/cart/api'

export const cartQueryOptions = queryOptions({
  queryKey: queryKeys.cart,
  queryFn: ({ signal }) => getCart({ signal }),
})
