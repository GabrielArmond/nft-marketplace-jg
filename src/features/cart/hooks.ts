import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/app/query-keys'
import type { AddCartItemInput, Cart } from '@/contracts/cart'
import {
  addCartItem,
  applyCoupon,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from '@/features/cart/api'
import { cartQueryOptions } from '@/features/cart/queries'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'
import { showToast } from '@/lib/toast'

/** Copies in the cart, as the badge shows them. */
export function useCartCount(): number {
  const { data = 0 } = useQuery({
    ...cartQueryOptions,
    select: (cart) => cart.items.reduce((total, { quantity }) => total + quantity, 0),
  })
  return data
}

/** Copies of one edition already in the cart: they count against what is available. */
export function useCartQuantity(editionId: string): number {
  const { data = 0 } = useQuery({
    ...cartQueryOptions,
    select: ({ items }) => items.find((item) => item.editionId === editionId)?.quantity ?? 0,
  })
  return data
}

/** Every cart write answers with the whole cart: its totals are the server's. */
function useCartMutation<Input>(mutationFn: (input: Input) => Promise<Cart>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart, cart)
    },
  })
}

export function useAddToCart() {
  return useCartMutation((input: AddCartItemInput) => addCartItem(input))
}

/** Failed item changes leave the cached cart untouched and refresh it: stock may have moved. */
function useItemMutation<Input>(mutationFn: (input: Input) => Promise<Cart>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart, cart)
    },
    onError: (error) => {
      if (isApiError(error, 'unauthorized')) return

      showToast(normalizeApiError(error).message, 'error')
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })
}

export function useUpdateCartItem(itemId: string) {
  return useItemMutation((quantity: number) => updateCartItem(itemId, { quantity }))
}

export function useRemoveCartItem(itemId: string) {
  return useItemMutation(() => removeCartItem(itemId))
}

export function useApplyCoupon() {
  return useCartMutation((code: string) => applyCoupon({ code }))
}

export function useRemoveCoupon() {
  return useItemMutation(() => removeCoupon())
}
