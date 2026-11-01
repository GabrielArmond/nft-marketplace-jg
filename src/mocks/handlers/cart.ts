import { HttpResponse } from 'msw'

import {
  addCartItemInputSchema,
  applyCouponInputSchema,
  updateCartItemInputSchema,
} from '@/contracts/cart'
import {
  addItem,
  applyCoupon,
  readCart,
  removeCoupon,
  removeItem,
  updateItem,
} from '@/mocks/domain/cart'
import { param, readBody, route } from '@/mocks/handlers/route'

export const cartHandlers = [
  route('get', '/cart', () => HttpResponse.json(readCart())),

  route('post', '/cart/items', async ({ request }) =>
    HttpResponse.json(addItem(await readBody(request, addCartItemInputSchema)), { status: 201 }),
  ),

  route('patch', '/cart/items/:itemId', async (context) => {
    const { quantity } = await readBody(context.request, updateCartItemInputSchema)
    return HttpResponse.json(updateItem(param(context, 'itemId'), quantity))
  }),

  route('delete', '/cart/items/:itemId', (context) =>
    HttpResponse.json(removeItem(param(context, 'itemId'))),
  ),

  route('put', '/cart/coupon', async ({ request }) => {
    const { code } = await readBody(request, applyCouponInputSchema)
    return HttpResponse.json(applyCoupon(code))
  }),

  route('delete', '/cart/coupon', () => HttpResponse.json(removeCoupon())),
]
