import { HttpResponse } from 'msw'

import { createQuoteInputSchema } from '@/contracts/cart'
import { API_ERROR_CODES, IDEMPOTENCY_KEY_HEADER } from '@/contracts/common'
import { createOrderInputSchema } from '@/contracts/orders'
import { getDb } from '@/mocks/db/store'
import { requireUser } from '@/mocks/domain/auth'
import { createOrder, createQuote, findOwnOrder } from '@/mocks/domain/checkout'
import { MockHttpError } from '@/mocks/domain/errors'
import { param, readBody, route } from '@/mocks/handlers/route'

export const checkoutHandlers = [
  route('post', '/quotes', async ({ request }) => {
    const user = requireUser()
    const input = await readBody(request, createQuoteInputSchema)
    return HttpResponse.json(createQuote(user, input), { status: 201 })
  }),

  route('post', '/orders', async ({ request }) => {
    const user = requireUser()
    const key = request.headers.get(IDEMPOTENCY_KEY_HEADER)

    if (!key) {
      throw new MockHttpError(
        400,
        API_ERROR_CODES.idempotencyKeyRequired,
        `Envie o cabeçalho ${IDEMPOTENCY_KEY_HEADER}.`,
      )
    }

    const input = await readBody(request, createOrderInputSchema)
    const { order, created } = createOrder(user, key, input)
    return HttpResponse.json(order, { status: created ? 201 : 200 })
  }),

  route('get', '/orders', () => {
    const { id } = requireUser()
    const items = getDb()
      .orders.filter(({ userId }) => userId === id)
      .map(({ order }) => order)
    return HttpResponse.json({ items })
  }),

  route('get', '/orders/:id', (context) => {
    const { id } = requireUser()
    return HttpResponse.json(findOwnOrder(id, param(context, 'id')).order)
  }),
]
