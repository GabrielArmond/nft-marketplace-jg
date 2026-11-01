import { quoteSchema, type CreateQuoteInput, type Quote } from '@/contracts/cart'
import { IDEMPOTENCY_KEY_HEADER } from '@/contracts/common'
import {
  orderListSchema,
  orderSchema,
  type CreateOrderInput,
  type Order,
  type OrderList,
} from '@/contracts/orders'
import { requestJson, type RequestOptions } from '@/lib/http/request'

export function createQuote(input: CreateQuoteInput): Promise<Quote> {
  return requestJson(quoteSchema, { method: 'POST', url: '/quotes', data: input })
}

/**
 * Keep the same `idempotencyKey` across retries of one attempt: that is what
 * recovers the existing order after a timeout instead of buying twice.
 */
export function createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<Order> {
  return requestJson(orderSchema, {
    method: 'POST',
    url: '/orders',
    data: input,
    headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
  })
}

export function getOrder(id: string, options?: RequestOptions): Promise<Order> {
  return requestJson(orderSchema, { url: `/orders/${encodeURIComponent(id)}`, ...options })
}

export function listOrders(options?: RequestOptions): Promise<OrderList> {
  return requestJson(orderListSchema, { url: '/orders', ...options })
}
