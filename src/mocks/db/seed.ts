import type { MockDb, RuntimeState } from '@/mocks/db/types'
import {
  ANNA_ID,
  GABRIEL_ID,
  createCouponFixtures,
  createUserFixtures,
  createWalletFixtures,
} from '@/mocks/fixtures/accounts'
import { createNftFixtures } from '@/mocks/fixtures/nfts'

export const DB_SCHEMA_VERSION = 1
export const DEFAULT_SCENARIO_ID = 'default'
export const DEFAULT_SEED = 1

const SEEDED_AT = '2026-09-01T12:00:00.000Z'

export function createRuntime(overrides: Partial<RuntimeState> = {}): RuntimeState {
  return {
    scenarioId: DEFAULT_SCENARIO_ID,
    seed: DEFAULT_SEED,
    requestCount: 0,
    clockOffsetMs: 0,
    latencyOverrideMs: null,
    ruleUses: {},
    customRules: [],
    socketDown: false,
    ...overrides,
  }
}

/** The known starting point: building it twice yields identical documents. */
export function createSeed(runtime?: Partial<RuntimeState>): MockDb {
  return {
    schemaVersion: DB_SCHEMA_VERSION,
    nextId: 1,
    users: createUserFixtures(),
    sessions: [],
    nfts: createNftFixtures(),
    favorites: {
      [ANNA_ID]: ['emerald-ape-042', 'ivory-baron-088'],
      [GABRIEL_ID]: ['golden-beat-207'],
    },
    carts: {
      [`user:${ANNA_ID}`]: {
        lines: [
          {
            id: 'itm_seed_1',
            nftId: 'emerald-ape-042',
            editionId: 'emerald-ape-042:1-50',
            quantity: 2,
            seenPriceEth: '1.19',
          },
        ],
        couponCode: null,
        updatedAt: SEEDED_AT,
      },
    },
    coupons: createCouponFixtures(),
    wallets: createWalletFixtures(),
    quotes: [],
    orders: [],
    idempotency: [],
    runtime: createRuntime(runtime),
  }
}
