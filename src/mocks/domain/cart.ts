import type { AddCartItemInput, Cart, CartItem, SummaryTotals } from '@/contracts/cart'
import { API_ERROR_CODES, type Network } from '@/contracts/common'
import { addEth, applyBasisPoints, multiplyEth, subtractEth } from '@/lib/money/eth'
import { getDb } from '@/mocks/db/store'
import type { CartLineRecord, CartRecord, CouponRecord } from '@/mocks/db/types'
import {
  clearGuestToken,
  currentUserId,
  ensureGuestToken,
  guestToken,
  hasSessionCookie,
  requireUser,
} from '@/mocks/domain/auth'
import { findEdition, findNft } from '@/mocks/domain/catalog'
import { nextId, nowIso, nowMs } from '@/mocks/domain/clock'
import { invalidFields, MockHttpError, notFound } from '@/mocks/domain/errors'

const NETWORK_FEES: Record<Network, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.0008',
}

export function userCartKey(userId: string): string {
  return `user:${userId}`
}

/** A lapsed session answers 401 instead of silently falling back to a guest cart. */
function readOwnerKey(): string | null {
  if (hasSessionCookie()) return userCartKey(requireUser().id)

  const guest = guestToken()
  return guest ? `guest:${guest}` : null
}

function ensureOwnerKey(): string {
  return readOwnerKey() ?? `guest:${ensureGuestToken()}`
}

export function ensureCart(ownerKey: string): CartRecord {
  const { carts } = getDb()
  return (carts[ownerKey] ??= { lines: [], couponCode: null, updatedAt: nowIso() })
}

function conflict(message: string): MockHttpError {
  return new MockHttpError(409, API_ERROR_CODES.availabilityConflict, message)
}

export function findCoupon(code: string): CouponRecord | undefined {
  return getDb().coupons.find((coupon) => coupon.code === code.toUpperCase())
}

export function isCouponActive(coupon: CouponRecord): boolean {
  return Date.parse(coupon.expiresAt) > nowMs()
}

export function computeTotals(
  subtotalEth: string,
  couponCode: string | null,
  network: Network,
): SummaryTotals {
  const coupon = couponCode ? findCoupon(couponCode) : undefined
  const discountEth = coupon ? applyBasisPoints(subtotalEth, coupon.basisPoints) : '0'
  const networkFeeEth = subtotalEth === '0' ? '0' : NETWORK_FEES[network]

  return {
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth: addEth(subtractEth(subtotalEth, discountEth), networkFeeEth),
  }
}

export function toCartItem(line: CartLineRecord): CartItem {
  const nft = findNft(line.nftId)
  const edition = findEdition(nft, line.editionId)

  return {
    id: line.id,
    nftId: nft.id,
    editionId: edition.id,
    editionLabel: edition.label,
    name: nft.name,
    tokenId: nft.tokenId,
    image: nft.image,
    quantity: line.quantity,
    unitPriceEth: edition.priceEth,
    lineTotalEth: multiplyEth(edition.priceEth, line.quantity),
    available: edition.available,
  }
}

function toCart(record: CartRecord): Cart {
  const items = record.lines.map(toCartItem)
  const subtotalEth = addEth(...items.map(({ lineTotalEth }) => lineTotalEth))

  return {
    items,
    couponCode: record.couponCode,
    summary: computeTotals(subtotalEth, record.couponCode, 'ethereum'),
    updatedAt: record.updatedAt,
  }
}

export function readCart(): Cart {
  const ownerKey = readOwnerKey()
  return toCart(ownerKey ? ensureCart(ownerKey) : ensureCart('guest:none'))
}

function findLine(record: CartRecord, itemId: string): CartLineRecord {
  const line = record.lines.find(({ id }) => id === itemId)
  if (!line) throw notFound('Item inexistente no carrinho.')
  return line
}

function assertAvailable(nftId: string, editionId: string, quantity: number): void {
  const edition = findEdition(findNft(nftId), editionId)
  if (quantity > edition.available) {
    throw conflict(`Restam apenas ${edition.available.toString()} unidades desta edição.`)
  }
}

export function addItem({ nftId, editionId, quantity }: AddCartItemInput): Cart {
  const nft = findNft(nftId)
  const edition = findEdition(nft, editionId)
  const record = ensureCart(ensureOwnerKey())
  const line = record.lines.find((item) => item.nftId === nftId && item.editionId === editionId)

  assertAvailable(nftId, editionId, (line?.quantity ?? 0) + quantity)
  if (line) {
    line.quantity += quantity
    line.seenPriceEth = edition.priceEth
  } else {
    record.lines.push({
      id: nextId('itm'),
      nftId,
      editionId,
      quantity,
      seenPriceEth: edition.priceEth,
    })
  }
  record.updatedAt = nowIso()
  return toCart(record)
}

function requireCart(): CartRecord {
  const ownerKey = readOwnerKey()
  if (!ownerKey) throw notFound('Item inexistente no carrinho.')
  return ensureCart(ownerKey)
}

export function updateItem(itemId: string, quantity: number): Cart {
  const record = requireCart()
  const line = findLine(record, itemId)

  assertAvailable(line.nftId, line.editionId, quantity)
  line.quantity = quantity
  record.updatedAt = nowIso()
  return toCart(record)
}

export function removeItem(itemId: string): Cart {
  const record = requireCart()

  findLine(record, itemId)
  record.lines = record.lines.filter(({ id }) => id !== itemId)
  record.updatedAt = nowIso()
  return toCart(record)
}

export function applyCoupon(code: string): Cart {
  const coupon = findCoupon(code)
  if (!coupon) {
    throw invalidFields(
      { code: ['Cupom inválido.'] },
      API_ERROR_CODES.couponInvalid,
      'Cupom inválido.',
    )
  }
  if (!isCouponActive(coupon)) {
    throw invalidFields(
      { code: ['Este cupom expirou.'] },
      API_ERROR_CODES.couponExpired,
      'Este cupom expirou.',
    )
  }

  const record = ensureCart(ensureOwnerKey())
  record.couponCode = coupon.code
  record.updatedAt = nowIso()
  return toCart(record)
}

export function removeCoupon(): Cart {
  const record = requireCart()
  record.couponCode = null
  record.updatedAt = nowIso()
  return toCart(record)
}

/** Keeps what the visitor picked when they authenticate, capped by stock. */
export function mergeGuestCartInto(userId: string): void {
  const token = guestToken()
  if (!token) return

  const { carts } = getDb()
  const guestKey = `guest:${token}`
  const guest = carts[guestKey]
  const target = ensureCart(userCartKey(userId))

  for (const line of guest?.lines ?? []) {
    const existing = target.lines.find(
      (item) => item.nftId === line.nftId && item.editionId === line.editionId,
    )
    const { available } = findEdition(findNft(line.nftId), line.editionId)

    if (existing) {
      existing.quantity = Math.min(existing.quantity + line.quantity, available)
    } else {
      target.lines.push({ ...line, quantity: Math.min(line.quantity, available) })
    }
  }

  target.lines = target.lines.filter(({ quantity }) => quantity > 0)
  target.couponCode ??= guest?.couponCode ?? null
  target.updatedAt = nowIso()
  Reflect.deleteProperty(carts, guestKey)
  clearGuestToken()
}

/** Exposed for the scenario mutations that act on the buyer's first item. */
export function firstLineOfCurrentUser(): CartLineRecord | undefined {
  const userId = currentUserId()
  return userId ? getDb().carts[userCartKey(userId)]?.lines[0] : undefined
}
