import * as z from 'zod/mini'

import {
  ethAmountSchema,
  imageSchema,
  isoDateTimeSchema,
  networkSchema,
  quantitySchema,
} from '@/contracts/common'

export const summaryTotalsSchema = z.object({
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
})
export type SummaryTotals = z.infer<typeof summaryTotalsSchema>

export const cartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  editionLabel: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  quantity: quantitySchema,
  /** Current price: the cart follows the catalog until a quote freezes it. */
  unitPriceEth: ethAmountSchema,
  lineTotalEth: ethAmountSchema,
  available: z.int().check(z.gte(0)),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  couponCode: z.nullable(z.string()),
  /** Estimate using the Ethereum fee; the quote is the reference to purchase. */
  summary: summaryTotalsSchema,
  updatedAt: isoDateTimeSchema,
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemInputSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  quantity: quantitySchema,
})
export type AddCartItemInput = z.infer<typeof addCartItemInputSchema>

export const updateCartItemInputSchema = z.object({ quantity: quantitySchema })
export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>

export const applyCouponInputSchema = z.object({
  code: z.string('Informe o código.').check(z.trim(), z.minLength(1, 'Informe o código.')),
})
export type ApplyCouponInput = z.infer<typeof applyCouponInputSchema>

export const QUOTE_ISSUE_TYPES = [
  'price_changed',
  'insufficient_availability',
  'coupon_expired',
] as const

export const quoteIssueSchema = z.object({
  type: z.enum(QUOTE_ISSUE_TYPES),
  /** `null` when the issue concerns the whole cart, such as an expired coupon. */
  itemId: z.nullable(z.string()),
  nftId: z.nullable(z.string()),
  message: z.string(),
})
export type QuoteIssue = z.infer<typeof quoteIssueSchema>

export const quoteLineSchema = z.object({
  itemId: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  editionLabel: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  quantity: quantitySchema,
  unitPriceEth: ethAmountSchema,
  lineTotalEth: ethAmountSchema,
})
export type QuoteLine = z.infer<typeof quoteLineSchema>

export const quoteSchema = z.extend(summaryTotalsSchema, {
  id: z.string(),
  network: networkSchema,
  couponCode: z.nullable(z.string()),
  lines: z.array(quoteLineSchema),
  /** What changed since the cart was last read; empty means the quote can be used. */
  issues: z.array(quoteIssueSchema),
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
})
export type Quote = z.infer<typeof quoteSchema>

export const createQuoteInputSchema = z.object({ network: networkSchema })
export type CreateQuoteInput = z.infer<typeof createQuoteInputSchema>
