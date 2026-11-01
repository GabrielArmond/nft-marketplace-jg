import { delay, HttpResponse } from 'msw'

import { commit, getDb } from '@/mocks/db/store'
import { expireCurrentSession } from '@/mocks/domain/auth'
import { firstLineOfCurrentUser } from '@/mocks/domain/cart'
import { findEdition, findNft, raiseEditionPrice, updateEdition } from '@/mocks/domain/catalog'
import { settleDueOrders } from '@/mocks/domain/checkout'
import {
  resolveScenario,
  type FaultRule,
  type LatencyProfile,
  type MockMutation,
} from '@/mocks/engine/scenarios'

const SETTLEMENT_TICK_MS = 200

export interface RequestInfo {
  method: string
  /** Path after the API base, such as `/nfts/emerald-ape-042`. */
  path: string
}

/** Small seeded generator (mulberry32): same seed and order, same latencies. */
function seededRandom(seed: number): number {
  const state = (seed + 0x6d2b79f5) | 0
  let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
  return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
}

function nextCount(key: string): number {
  const { ruleUses } = getDb().runtime
  const count = ruleUses[key] ?? 0
  ruleUses[key] = count + 1
  return count
}

function latencyFor(profile: LatencyProfile, { path }: RequestInfo): number {
  const { latencyOverrideMs, seed, requestCount } = getDb().runtime
  if (latencyOverrideMs !== null) return latencyOverrideMs

  switch (profile.type) {
    case 'fixed':
      return profile.ms
    case 'range':
      return Math.round(
        profile.minMs + seededRandom(seed + requestCount) * (profile.maxMs - profile.minMs),
      )
    case 'out-of-order': {
      if (!new RegExp(profile.path).test(path)) return profile.fastMs
      return nextCount('out-of-order') % 2 === 0 ? profile.slowMs : profile.fastMs
    }
  }
}

function matches(rule: FaultRule, phase: FaultRule['phase'], { method, path }: RequestInfo) {
  if (rule.phase !== phase) return false
  if (rule.method && rule.method !== method) return false
  return new RegExp(rule.path).test(path)
}

function hasUsesLeft(rule: FaultRule, key: string): boolean {
  return rule.times === undefined || (getDb().runtime.ruleUses[key] ?? 0) < rule.times
}

const MUTATIONS: Record<MockMutation, () => void> = {
  'expire-session': expireCurrentSession,
  'raise-cart-price': () => {
    const line = firstLineOfCurrentUser()
    if (line) raiseEditionPrice(line.nftId, line.editionId)
  },
  'sell-out-cart-edition': () => {
    const line = firstLineOfCurrentUser()
    if (!line) return

    findEdition(findNft(line.nftId), line.editionId)
    updateEdition(line.nftId, line.editionId, { available: 0 })
  },
}

async function runRules(
  phase: FaultRule['phase'],
  request: RequestInfo,
): Promise<Response | undefined> {
  const { scenarioId, customRules } = getDb().runtime
  const rules = [...customRules, ...resolveScenario(scenarioId).rules]

  for (const rule of rules) {
    const key = `${scenarioId}:${rule.id}`
    if (!matches(rule, phase, request) || !hasUsesLeft(rule, key)) continue

    nextCount(key)
    const { action } = rule

    switch (action.kind) {
      case 'mutate':
        MUTATIONS[action.mutation]()
        commit()
        break
      case 'network':
        commit()
        return HttpResponse.error()
      case 'hang':
        commit()
        await delay('infinite')
        return HttpResponse.error()
      case 'http':
        commit()
        return HttpResponse.json(
          {
            error: {
              code: action.code,
              message: action.message,
              ...(action.fieldErrors && { fieldErrors: action.fieldErrors }),
            },
          },
          { status: action.status },
        )
    }
  }
  return undefined
}

export async function beforeRequest(request: RequestInfo): Promise<Response | undefined> {
  const { runtime } = getDb()

  runtime.requestCount += 1
  settleDueOrders()
  await delay(latencyFor(resolveScenario(runtime.scenarioId).latency, request))
  return runRules('before', request)
}

export function afterRequest(request: RequestInfo): Promise<Response | undefined> {
  return runRules('after', request)
}

/** Keeps payments moving between requests, and resumes them after a refresh. */
export function startSettlementLoop(): void {
  setInterval(() => {
    if (settleDueOrders()) commit()
  }, SETTLEMENT_TICK_MS)
}
