import * as z from 'zod/mini'

import { emailSchema } from '@/contracts/auth'
import { quoteLineSchema, summaryTotalsSchema } from '@/contracts/cart'
import { isoDateTimeSchema, networkSchema } from '@/contracts/common'

/** `confirmed` and `refused` are terminal: no later event or request changes them. */
export const ORDER_STATUSES = ['pending', 'confirmed', 'refused'] as const
export const orderStatusSchema = z.enum(ORDER_STATUSES)
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const collectorSchema = z.object({
  displayName: z.string('Informe o nome de exibição.').check(z.minLength(1, 'Informe o nome de exibição.')),
  username: z.string('Informe o nome de usuário.').check(z.minLength(1, 'Informe o nome de usuário.')),
  email: emailSchema,
  profileName: z.optional(z.string()),
  referralCode: z.optional(z.string()),
  ensName: z.optional(z.string()),
  note: z.optional(z.string().check(z.maxLength(500, 'Use até 500 caracteres.'))),
})
export type Collector = z.infer<typeof collectorSchema>

/** Frozen copy of the purchase: later catalog changes never reach it. */
export const receiptSchema = z.extend(summaryTotalsSchema, {
  orderNumber: z.string(),
  network: networkSchema,
  couponCode: z.nullable(z.string()),
  lines: z.array(quoteLineSchema),
  walletLabel: z.string(),
  walletAddress: z.string(),
  collector: collectorSchema,
  transactionHash: z.string(),
  explorerUrl: z.string(),
  confirmedAt: isoDateTimeSchema,
})
export type Receipt = z.infer<typeof receiptSchema>

export const orderSchema = z.extend(summaryTotalsSchema, {
  id: z.string(),
  number: z.string(),
  status: orderStatusSchema,
  network: networkSchema,
  couponCode: z.nullable(z.string()),
  lines: z.array(quoteLineSchema),
  refusalReason: z.nullable(z.string()),
  /** Present only once the order is confirmed. */
  receipt: z.nullable(receiptSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  version: z.int().check(z.gte(1)),
})
export type Order = z.infer<typeof orderSchema>

export const orderListSchema = z.object({ items: z.array(orderSchema) })
export type OrderList = z.infer<typeof orderListSchema>

export const createOrderInputSchema = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  network: networkSchema,
  collector: collectorSchema,
})
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>
