import type { Cart, Quote } from '@/contracts/cart'

/** Everything that can change a quote. It goes in the query key, so a change asks the API. */
export function cartSignature({ items, couponCode }: Cart): string {
  return JSON.stringify([
    couponCode,
    items.map(({ id, quantity, unitPriceEth, available }) => [
      id,
      quantity,
      unitPriceEth,
      available,
    ]),
  ])
}

function linesOf({ lines }: Quote): string {
  return JSON.stringify(
    lines.map(({ editionId, quantity, unitPriceEth }) => [editionId, quantity, unitPriceEth]),
  )
}

/**
 * Whether the buyer must confirm these values before going on. The coupon and the
 * network are the buyer's own choices here, so they only count through an issue.
 */
export function needsAcceptance(quote: Quote, accepted: Quote | null): boolean {
  if (accepted?.id === quote.id) return false
  if (quote.issues.length > 0 || !accepted) return true
  if (linesOf(quote) !== linesOf(accepted)) return true
  return quote.network === accepted.network && quote.networkFeeEth !== accepted.networkFeeEth
}

export function hasStockIssue({ issues }: Quote): boolean {
  return issues.some(({ type }) => type === 'insufficient_availability')
}
