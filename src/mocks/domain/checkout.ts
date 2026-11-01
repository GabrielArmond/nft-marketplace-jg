import type {
  CreateQuoteInput,
  Quote,
  QuoteIssue,
  QuoteLine,
} from '@/contracts/cart'
import { API_ERROR_CODES, type Network } from '@/contracts/common'
import type { CreateOrderInput, Order, Receipt } from '@/contracts/orders'
import { addEth } from '@/lib/money/eth'
import { getDb } from '@/mocks/db/store'
import type { CartRecord, OrderRecord, PaymentOutcome, UserRecord } from '@/mocks/db/types'
import {
  computeTotals,
  ensureCart,
  findCoupon,
  isCouponActive,
  toCartItem,
  userCartKey,
} from '@/mocks/domain/cart'
import { findEdition, findNft, touchNft } from '@/mocks/domain/catalog'
import { nextId, nowIso, nowMs } from '@/mocks/domain/clock'
import { MockHttpError, notFound } from '@/mocks/domain/errors'
import { publishOrderUpdated } from '@/mocks/domain/events'
import { resolveScenario } from '@/mocks/engine/scenarios'

const QUOTE_TTL_MS = 5 * 60_000
const SETTLEMENT_DELAY_MS = 1_500
const REFUSAL_REASON = 'O pagamento foi recusado pela carteira.'

const EXPLORERS: Record<Network, string> = {
  ethereum: 'https://sepolia.etherscan.io/tx/',
  polygon: 'https://amoy.polygonscan.com/tx/',
  solana: 'https://explorer.solana.com/tx/',
}

function currentLines(cart: CartRecord): QuoteLine[] {
  return cart.lines.map((line) => {
    const { id, ...item } = toCartItem(line)
    const { available: _available, ...rest } = item
    return { itemId: id, ...rest }
  })
}

function validCouponCode(cart: CartRecord): string | null {
  const coupon = cart.couponCode ? findCoupon(cart.couponCode) : undefined
  return coupon && isCouponActive(coupon) ? coupon.code : null
}

function collectIssues(cart: CartRecord): QuoteIssue[] {
  const issues: QuoteIssue[] = []

  for (const line of cart.lines) {
    const item = toCartItem(line)

    if (item.unitPriceEth !== line.seenPriceEth) {
      issues.push({
        type: 'price_changed',
        itemId: item.id,
        nftId: item.nftId,
        message: `O preço de ${item.name} mudou para ${item.unitPriceEth} ETH.`,
      })
    }
    if (item.quantity > item.available) {
      issues.push({
        type: 'insufficient_availability',
        itemId: item.id,
        nftId: item.nftId,
        message: `Restam ${item.available.toString()} unidades de ${item.name}.`,
      })
    }
  }

  if (cart.couponCode && !validCouponCode(cart)) {
    issues.push({
      type: 'coupon_expired',
      itemId: null,
      nftId: null,
      message: 'O cupom aplicado expirou.',
    })
  }
  return issues
}

export function createQuote(user: UserRecord, { network }: CreateQuoteInput): Quote {
  const db = getDb()
  const ownerKey = userCartKey(user.id)
  const cart = ensureCart(ownerKey)

  if (cart.lines.length === 0) {
    throw new MockHttpError(409, API_ERROR_CODES.cartEmpty, 'O carrinho está vazio.')
  }

  const issues = collectIssues(cart)
  const couponCode = validCouponCode(cart)
  const lines = currentLines(cart)
  const subtotalEth = addEth(...lines.map(({ lineTotalEth }) => lineTotalEth))
  const quote: Quote = {
    id: nextId('quo'),
    network,
    couponCode,
    lines,
    issues,
    ...computeTotals(subtotalEth, couponCode, network),
    createdAt: nowIso(),
    expiresAt: new Date(nowMs() + QUOTE_TTL_MS).toISOString(),
  }

  // The buyer is seeing these values now: the next quote only reports new changes.
  cart.couponCode = couponCode
  for (const line of cart.lines) line.seenPriceEth = toCartItem(line).unitPriceEth

  db.quotes.push({ quote, ownerKey })
  return quote
}

function staleQuote(): MockHttpError {
  return new MockHttpError(
    409,
    API_ERROR_CODES.quoteStale,
    'Os valores mudaram. Revise a nova cotação para continuar.',
  )
}

function assertQuoteIsCurrent(quote: Quote, cart: CartRecord): void {
  if (Date.parse(quote.expiresAt) <= nowMs()) throw staleQuote()

  for (const line of quote.lines) {
    const { available } = findEdition(findNft(line.nftId), line.editionId)
    if (line.quantity > available) {
      throw new MockHttpError(
        409,
        API_ERROR_CODES.availabilityConflict,
        `Restam ${available.toString()} unidades de ${line.name}.`,
      )
    }
  }

  const current = JSON.stringify(currentLines(cart))
  const quoted = JSON.stringify(quote.lines)
  if (current !== quoted || validCouponCode(cart) !== quote.couponCode) throw staleQuote()
}

function reserveStock(lines: readonly QuoteLine[], direction: 1 | -1): void {
  for (const line of lines) {
    const nft = findNft(line.nftId)
    findEdition(nft, line.editionId).available -= direction * line.quantity
    touchNft(nft)
  }
}

interface CreateOrderResult {
  order: Order
  created: boolean
}

export function createOrder(
  user: UserRecord,
  idempotencyKey: string,
  input: CreateOrderInput,
): CreateOrderResult {
  const db = getDb()
  const fingerprint = JSON.stringify(input)
  const replay = db.idempotency.find(
    ({ userId, key }) => userId === user.id && key === idempotencyKey,
  )

  if (replay) {
    if (replay.fingerprint !== fingerprint) {
      throw new MockHttpError(
        409,
        API_ERROR_CODES.idempotencyKeyReused,
        'Esta tentativa já foi usada com outros dados.',
      )
    }
    return { order: findOwnOrder(user.id, replay.orderId).order, created: false }
  }

  const ownerKey = userCartKey(user.id)
  const quote = db.quotes.find(
    (record) => record.quote.id === input.quoteId && record.ownerKey === ownerKey,
  )?.quote
  if (!quote) throw staleQuote()

  const wallet = db.wallets.find(({ id, userId }) => id === input.walletId && userId === user.id)
  if (!wallet) throw notFound('Carteira inexistente.')
  if (!wallet.connected) {
    throw new MockHttpError(
      409,
      API_ERROR_CODES.walletNotConnected,
      'Conecte a carteira para continuar.',
    )
  }

  assertQuoteIsCurrent(quote, ensureCart(ownerKey))
  reserveStock(quote.lines, 1)

  const sequence = db.orders.length + 1
  const timestamp = nowIso()
  const record: OrderRecord = {
    order: {
      id: nextId('ord'),
      number: `KUR-${sequence.toString().padStart(5, '0')}`,
      status: 'pending',
      network: input.network,
      couponCode: quote.couponCode,
      lines: structuredClone(quote.lines),
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      refusalReason: null,
      receipt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
    },
    userId: user.id,
    collector: input.collector,
    walletLabel: wallet.label,
    walletAddress: wallet.address,
    outcome: resolveScenario(db.runtime.scenarioId).payment,
    settleAtMs: nowMs() + SETTLEMENT_DELAY_MS,
  }

  db.orders.push(record)
  db.idempotency.push({
    userId: user.id,
    key: idempotencyKey,
    fingerprint,
    orderId: record.order.id,
  })
  publishOrderUpdated(record)
  return { order: record.order, created: true }
}

export function findOwnOrder(userId: string, orderId: string): OrderRecord {
  const record = getDb().orders.find(({ order }) => order.id === orderId)
  if (!record) throw notFound('Pedido inexistente.')
  if (record.userId !== userId) {
    throw new MockHttpError(403, API_ERROR_CODES.forbidden, 'Este pedido é de outra conta.')
  }
  return record
}

function transactionHash(orderId: string): string {
  let state = 0x811c9dc5
  let hash = ''

  while (hash.length < 64) {
    for (const character of `${orderId}:${hash.length.toString()}`) {
      state = Math.imul(state ^ character.charCodeAt(0), 0x01000193) >>> 0
    }
    hash += state.toString(16).padStart(8, '0')
  }
  return `0x${hash.slice(0, 64)}`
}

function buildReceipt(record: OrderRecord, confirmedAt: string): Receipt {
  const { order, collector, walletLabel, walletAddress } = record
  const hash = transactionHash(order.id)

  return {
    orderNumber: order.number,
    network: order.network,
    couponCode: order.couponCode,
    lines: structuredClone(order.lines),
    subtotalEth: order.subtotalEth,
    discountEth: order.discountEth,
    networkFeeEth: order.networkFeeEth,
    totalEth: order.totalEth,
    walletLabel,
    walletAddress,
    collector,
    transactionHash: hash,
    explorerUrl: `${EXPLORERS[order.network]}${hash}`,
    confirmedAt,
  }
}

/** Removes only what was bought: anything added meanwhile stays in the cart. */
function removePurchasedItems(record: OrderRecord): void {
  const cart = getDb().carts[userCartKey(record.userId)]
  if (!cart) return

  for (const purchased of record.order.lines) {
    const line = cart.lines.find(
      ({ nftId, editionId }) => nftId === purchased.nftId && editionId === purchased.editionId,
    )
    if (line) line.quantity -= purchased.quantity
  }
  cart.lines = cart.lines.filter(({ quantity }) => quantity > 0)
  cart.updatedAt = nowIso()
}

type Settlement = Exclude<PaymentOutcome, 'hold'>

/** Returns false for a terminal order: confirmed and refused never change. */
export function settleOrder(record: OrderRecord, outcome: Settlement): boolean {
  const { order } = record
  if (order.status !== 'pending') return false

  const timestamp = nowIso()
  order.status = outcome
  order.updatedAt = timestamp
  order.version += 1

  if (outcome === 'confirmed') {
    order.receipt = buildReceipt(record, timestamp)
    removePurchasedItems(record)
  } else {
    order.refusalReason = REFUSAL_REASON
    reserveStock(order.lines, -1)
  }

  publishOrderUpdated(record)
  return true
}

/** Advances due payments. Runs on a timer and on every request, surviving a refresh. */
export function settleDueOrders(): boolean {
  let changed = false

  for (const record of getDb().orders) {
    if (record.order.status !== 'pending' || record.outcome === 'hold') continue
    if (record.settleAtMs <= nowMs()) changed = settleOrder(record, record.outcome) || changed
  }
  return changed
}
