import * as z from 'zod/mini'

import { ETH_AMOUNT_PATTERN } from '@/lib/money/eth'

export const ethAmountSchema = z.string().check(z.regex(ETH_AMOUNT_PATTERN))
export type EthAmount = z.infer<typeof ethAmountSchema>

export const quantitySchema = z.int().check(z.gte(1))

export const isoDateTimeSchema = z.iso.datetime()

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export const networkSchema = z.enum(NETWORKS)
export type Network = z.infer<typeof networkSchema>

export const imageSchema = z.object({
  /** 640px WebP: detail and hero. */
  url: z.string(),
  /** 320px WebP: cards and cart rows. */
  thumbnailUrl: z.string(),
  alt: z.string(),
})
export type NftImage = z.infer<typeof imageSchema>

export function pageSchema<Item extends z.ZodMiniType>(item: Item) {
  return z.object({
    items: z.array(item),
    page: z.int().check(z.gte(1)),
    pageSize: z.int().check(z.gte(1)),
    totalItems: z.int().check(z.gte(0)),
    totalPages: z.int().check(z.gte(0)),
  })
}

/** Stable identifiers of failures, for flows that must branch on the exact cause. */
export const API_ERROR_CODES = {
  validationFailed: 'VALIDATION_FAILED',
  invalidCredentials: 'INVALID_CREDENTIALS',
  sessionInvalid: 'SESSION_INVALID',
  sessionExpired: 'SESSION_EXPIRED',
  forbidden: 'FORBIDDEN',
  notFound: 'NOT_FOUND',
  emailTaken: 'EMAIL_TAKEN',
  usernameTaken: 'USERNAME_TAKEN',
  availabilityConflict: 'AVAILABILITY_CONFLICT',
  quoteStale: 'QUOTE_STALE',
  cartEmpty: 'CART_EMPTY',
  couponInvalid: 'COUPON_INVALID',
  couponExpired: 'COUPON_EXPIRED',
  idempotencyKeyRequired: 'IDEMPOTENCY_KEY_REQUIRED',
  idempotencyKeyReused: 'IDEMPOTENCY_KEY_REUSED',
  walletNotConnected: 'WALLET_NOT_CONNECTED',
  walletRejected: 'WALLET_REJECTED',
  rateLimited: 'RATE_LIMITED',
  serviceUnavailable: 'SERVICE_UNAVAILABLE',
} as const
export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key'

/** Every non-2xx body. Consumed by `normalizeApiError`. */
export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fieldErrors: z.optional(z.record(z.string(), z.array(z.string()))),
  }),
})
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>
