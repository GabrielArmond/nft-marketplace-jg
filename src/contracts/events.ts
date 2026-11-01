import * as z from 'zod/mini'

import { ethAmountSchema, isoDateTimeSchema } from '@/contracts/common'
import { editionSchema } from '@/contracts/nfts'
import { orderStatusSchema } from '@/contracts/orders'

export const NFT_UPDATED_EVENT = 'nft.updated'
export const ORDER_UPDATED_EVENT = 'order.updated'

/**
 * Common shape of realtime events. `id` is stable (a redelivery repeats it) and
 * `version` is the version of the resource after the change, so consumers drop
 * duplicates by `id` and stale deliveries by comparing `version`.
 */
const eventBase = {
  id: z.string(),
  occurredAt: isoDateTimeSchema,
  version: z.int().check(z.gte(1)),
}

export const nftUpdatedEventSchema = z.object({
  ...eventBase,
  type: z.literal(NFT_UPDATED_EVENT),
  resource: z.object({ type: z.literal('nft'), id: z.string() }),
  data: z.object({
    priceEth: ethAmountSchema,
    compareAtPriceEth: z.nullable(ethAmountSchema),
    soldOut: z.boolean(),
    editions: z.array(editionSchema),
  }),
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = z.object({
  ...eventBase,
  type: z.literal(ORDER_UPDATED_EVENT),
  resource: z.object({ type: z.literal('order'), id: z.string() }),
  data: z.object({
    status: orderStatusSchema,
    refusalReason: z.nullable(z.string()),
  }),
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export interface ServerToClientEvents {
  [NFT_UPDATED_EVENT]: (event: NftUpdatedEvent) => void
  [ORDER_UPDATED_EVENT]: (event: OrderUpdatedEvent) => void
}

/** The client only listens: every write goes through REST. */
export type ClientToServerEvents = Record<string, never>
