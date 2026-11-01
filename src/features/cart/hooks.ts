import { useQuery } from '@tanstack/react-query'

import { cartQueryOptions } from '@/features/cart/queries'

export function useCartCount(): number {
  const { data = 0 } = useQuery({
    ...cartQueryOptions,
    select: (cart) => cart.items.reduce((total, { quantity }) => total + quantity, 0),
  })
  return data
}
