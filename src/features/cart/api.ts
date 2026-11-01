import {
  cartSchema,
  type AddCartItemInput,
  type ApplyCouponInput,
  type Cart,
  type UpdateCartItemInput,
} from '@/contracts/cart'
import { requestJson, type RequestOptions } from '@/lib/http/request'

export function getCart(options?: RequestOptions): Promise<Cart> {
  return requestJson(cartSchema, { url: '/cart', ...options })
}

export function addCartItem(input: AddCartItemInput): Promise<Cart> {
  return requestJson(cartSchema, { method: 'POST', url: '/cart/items', data: input })
}

export function updateCartItem(itemId: string, input: UpdateCartItemInput): Promise<Cart> {
  return requestJson(cartSchema, {
    method: 'PATCH',
    url: `/cart/items/${encodeURIComponent(itemId)}`,
    data: input,
  })
}

export function removeCartItem(itemId: string): Promise<Cart> {
  return requestJson(cartSchema, {
    method: 'DELETE',
    url: `/cart/items/${encodeURIComponent(itemId)}`,
  })
}

export function applyCoupon(input: ApplyCouponInput): Promise<Cart> {
  return requestJson(cartSchema, { method: 'PUT', url: '/cart/coupon', data: input })
}

export function removeCoupon(): Promise<Cart> {
  return requestJson(cartSchema, { method: 'DELETE', url: '/cart/coupon' })
}
