import type { Wallet } from '@/contracts/account'
import type { Quote } from '@/contracts/cart'
import type { EthAmount } from '@/contracts/common'
import type { NftDetail } from '@/contracts/nfts'
import type { Collector, Order } from '@/contracts/orders'
import type { FaultRule } from '@/mocks/engine/scenarios'

export interface UserRecord {
  id: string
  email: string
  username: string
  displayName: string
  bio: string
  website: string
  ensName: string
  avatarUrl: string | null
  passwordSalt: string
  passwordHash: string
}

export interface SessionRecord {
  token: string
  userId: string
  expiresAtMs: number
}

export interface NftRecord extends NftDetail {
  /** Ordering of the "Em alta" tab: internal to the simulated server. */
  trendingScore: number
}

export interface CartLineRecord {
  id: string
  nftId: string
  editionId: string
  quantity: number
  /** Last price the owner saw, to report a change in the next quote. */
  seenPriceEth: EthAmount
}

export interface CartRecord {
  lines: CartLineRecord[]
  couponCode: string | null
  updatedAt: string
}

export interface CouponRecord {
  code: string
  basisPoints: number
  expiresAt: string
}

export interface WalletRecord extends Wallet {
  userId: string
}

export interface QuoteRecord {
  quote: Quote
  ownerKey: string
}

export type PaymentOutcome = 'confirmed' | 'refused' | 'hold'

export interface OrderRecord {
  order: Order
  userId: string
  collector: Collector
  walletLabel: string
  walletAddress: string
  outcome: PaymentOutcome
  settleAtMs: number
}

export interface IdempotencyRecord {
  userId: string
  key: string
  fingerprint: string
  orderId: string
}

/** Everything the scenario engine must remember across a refresh. */
export interface RuntimeState {
  scenarioId: string
  seed: number
  requestCount: number
  clockOffsetMs: number
  latencyOverrideMs: number | null
  ruleUses: Record<string, number>
  customRules: FaultRule[]
  socketDown: boolean
}

export interface MockDb {
  schemaVersion: number
  nextId: number
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: Record<string, string[]>
  /** Keyed by owner: `user:<id>` or `guest:<token>`. */
  carts: Record<string, CartRecord>
  coupons: CouponRecord[]
  wallets: WalletRecord[]
  quotes: QuoteRecord[]
  orders: OrderRecord[]
  idempotency: IdempotencyRecord[]
  runtime: RuntimeState
}
