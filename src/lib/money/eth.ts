/**
 * ETH amounts travel as decimal strings and are computed as integers of wei
 * (1 ETH = 10^18 wei) with `bigint`, the same precision as the chain. `number`
 * must never hold a price: 0.1 + 0.2 alone would already break a cart total.
 */
const WEI_DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(WEI_DECIMALS)
const BASIS_POINTS = 10_000n

export const ETH_AMOUNT_PATTERN = /^\d+(\.\d{1,18})?$/

export function isEthAmount(value: string): boolean {
  return ETH_AMOUNT_PATTERN.test(value)
}

export function toWei(amount: string): bigint {
  if (!isEthAmount(amount)) throw new RangeError(`Invalid ETH amount: "${amount}".`)

  const [whole = '0', fraction = ''] = amount.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(WEI_DECIMALS, '0'))
}

/** Canonical form: no trailing zeros, always a digit before the point ("0.016"). */
export function fromWei(wei: bigint): string {
  if (wei < 0n) throw new RangeError('ETH amounts cannot be negative.')

  const whole = wei / WEI_PER_ETH
  const fraction = (wei % WEI_PER_ETH).toString().padStart(WEI_DECIMALS, '0').replace(/0+$/, '')
  return fraction ? `${whole.toString()}.${fraction}` : whole.toString()
}

export function addEth(...amounts: string[]): string {
  return fromWei(amounts.reduce((total, amount) => total + toWei(amount), 0n))
}

/** Throws when the result would be negative: a discount can never exceed the total. */
export function subtractEth(amount: string, subtrahend: string): string {
  return fromWei(toWei(amount) - toWei(subtrahend))
}

export function multiplyEth(amount: string, quantity: number): string {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantity must be a non-negative integer, received ${quantity.toString()}.`)
  }
  return fromWei(toWei(amount) * BigInt(quantity))
}

/** Applies a rate in basis points (1000 = 10%), rounding down to the wei. */
export function applyBasisPoints(amount: string, basisPoints: number): string {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) {
    throw new RangeError(`Invalid basis points: ${basisPoints.toString()}.`)
  }
  return fromWei((toWei(amount) * BigInt(basisPoints)) / BASIS_POINTS)
}

export function compareEth(left: string, right: string): -1 | 0 | 1 {
  const difference = toWei(left) - toWei(right)
  if (difference === 0n) return 0
  return difference < 0n ? -1 : 1
}
