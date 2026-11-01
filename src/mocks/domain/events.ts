import {
  NFT_UPDATED_EVENT,
  ORDER_UPDATED_EVENT,
  type NftUpdatedEvent,
  type OrderUpdatedEvent,
  type RealtimeEvent,
} from '@/contracts/events'
import { getDb } from '@/mocks/db/store'
import type { NftRecord, OrderRecord } from '@/mocks/db/types'
import { nowIso } from '@/mocks/domain/clock'
import { resolveScenario } from '@/mocks/engine/scenarios'

export interface Delivery {
  event: RealtimeEvent
  /** `null` reaches every connection; otherwise only that user's. */
  audienceUserId: string | null
}

type Transport = (delivery: Delivery) => void

const HISTORY_LIMIT = 200

let transport: Transport = () => undefined
const history: Delivery[] = []

/** Connects the bus to the socket server. Until then events have nowhere to go. */
export function setEventTransport(next: Transport): void {
  transport = next
}

function previousOf(delivery: Delivery): Delivery | undefined {
  return history.findLast(
    ({ event }) =>
      event.resource.id === delivery.event.resource.id && event.version < delivery.event.version,
  )
}

function publish(delivery: Delivery): void {
  const { flags } = resolveScenario(getDb().runtime.scenarioId)

  transport(delivery)
  if (flags.duplicateEvents) transport(delivery)
  if (flags.staleEvents) {
    const previous = previousOf(delivery)
    if (previous) transport(previous)
  }

  history.push(delivery)
  if (history.length > HISTORY_LIMIT) history.shift()
}

export function publishNftUpdated(nft: NftRecord): NftUpdatedEvent {
  const event: NftUpdatedEvent = {
    id: `${NFT_UPDATED_EVENT}:${nft.id}:${nft.version.toString()}`,
    type: NFT_UPDATED_EVENT,
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: nowIso(),
    data: {
      priceEth: nft.priceEth,
      compareAtPriceEth: nft.compareAtPriceEth,
      soldOut: nft.soldOut,
      editions: structuredClone(nft.editions),
    },
  }
  publish({ event, audienceUserId: null })
  return event
}

export function publishOrderUpdated({ order, userId }: OrderRecord): OrderUpdatedEvent {
  const event: OrderUpdatedEvent = {
    id: `${ORDER_UPDATED_EVENT}:${order.id}:${order.version.toString()}`,
    type: ORDER_UPDATED_EVENT,
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: nowIso(),
    data: { status: order.status, refusalReason: order.refusalReason },
  }
  publish({ event, audienceUserId: userId })
  return event
}

/** Redelivers a past event untouched, to exercise duplicates and stale versions. */
export function replayEvent(eventId: string): boolean {
  const delivery = history.findLast(({ event }) => event.id === eventId)
  if (!delivery) return false

  transport(delivery)
  return true
}

export function listEventHistory(): RealtimeEvent[] {
  return history.map(({ event }) => event)
}

export function clearEventHistory(): void {
  history.length = 0
}
