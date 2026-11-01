import { http, HttpResponse, type HttpHandler } from 'msw'
import * as z from 'zod/mini'

import { ethAmountSchema } from '@/contracts/common'
import { commit, getDb, resetDb } from '@/mocks/db/store'
import { DEFAULT_SEED } from '@/mocks/db/seed'
import { clearAuthCookies, expireCurrentSession } from '@/mocks/domain/auth'
import { toDetail, updateEdition } from '@/mocks/domain/catalog'
import { settleDueOrders, settleOrder } from '@/mocks/domain/checkout'
import { nowIso } from '@/mocks/domain/clock'
import { MockHttpError, notFound } from '@/mocks/domain/errors'
import { clearEventHistory, listEventHistory, replayEvent } from '@/mocks/domain/events'
import { findScenario, listScenarios, type FaultRule } from '@/mocks/engine/scenarios'
import { readBody } from '@/mocks/handlers/route'
import { closeAllConnections, countConnections } from '@/mocks/realtime/socket-server'

/**
 * Control plane of the simulation. Same-origin HTTP, so Playwright and the demo
 * drive it through the network layer and never reach into the UI's state.
 */
export const CONTROL_BASE_PATH = '/__mock__'

const scenarioInputSchema = z.object({
  id: z.string(),
  seed: z.optional(z.int()),
  latencyMs: z.optional(z.nullable(z.int().check(z.gte(0)))),
})
const resetInputSchema = z.object({
  scenario: z.optional(z.string()),
  seed: z.optional(z.int()),
})
const clockInputSchema = z.object({
  advanceMs: z.optional(z.int()),
  now: z.optional(z.iso.datetime()),
})
const nftUpdateInputSchema = z.object({
  editionId: z.string(),
  priceEth: z.optional(ethAmountSchema),
  available: z.optional(z.int().check(z.gte(0))),
})
const settleInputSchema = z.object({ outcome: z.enum(['confirmed', 'refused']) })
const socketInputSchema = z.object({ action: z.enum(['disconnect', 'down', 'up']) })
const replayInputSchema = z.object({ eventId: z.string() })
const faultInputSchema = z.object({ rule: z.custom<FaultRule>() })

type Resolver = (request: Request) => Response | Promise<Response>

function control(
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  resolver: Resolver,
): HttpHandler {
  return http[method](`${CONTROL_BASE_PATH}${path}`, async ({ request }) => {
    try {
      const response = await resolver(request)
      commit()
      return response
    } catch (error) {
      if (error instanceof MockHttpError) {
        return HttpResponse.json(error.body, { status: error.status })
      }
      throw error
    }
  })
}

function assertScenario(id: string): void {
  if (!findScenario(id)) throw notFound(`Cenário "${id}" inexistente.`)
}

function pathSegment(request: Request, fromEnd: number): string {
  return decodeURIComponent(new URL(request.url).pathname.split('/').at(fromEnd) ?? '')
}

function stateSnapshot() {
  const { runtime, orders, sessions } = getDb()
  return {
    ...runtime,
    now: nowIso(),
    orders: orders.length,
    sessions: sessions.length,
    socketConnections: countConnections(),
    events: listEventHistory(),
    scenarios: listScenarios(),
  }
}

export const controlHandlers = [
  control('get', '/state', () => HttpResponse.json(stateSnapshot())),

  control('post', '/reset', async (request) => {
    const { scenario = 'default', seed = DEFAULT_SEED } = await readBody(request, resetInputSchema)

    assertScenario(scenario)
    closeAllConnections()
    clearEventHistory()
    clearAuthCookies()
    resetDb({ scenarioId: scenario, seed })
    return HttpResponse.json(stateSnapshot())
  }),

  control('post', '/scenario', async (request) => {
    const { id, seed, latencyMs } = await readBody(request, scenarioInputSchema)
    const { runtime } = getDb()

    assertScenario(id)
    runtime.scenarioId = id
    runtime.ruleUses = {}
    runtime.requestCount = 0
    if (seed !== undefined) runtime.seed = seed
    if (latencyMs !== undefined) runtime.latencyOverrideMs = latencyMs
    return HttpResponse.json(stateSnapshot())
  }),

  control('post', '/clock', async (request) => {
    const { advanceMs, now } = await readBody(request, clockInputSchema)
    const { runtime } = getDb()

    if (advanceMs !== undefined) runtime.clockOffsetMs += advanceMs
    if (now !== undefined) runtime.clockOffsetMs = Date.parse(now) - Date.now()
    settleDueOrders()
    return HttpResponse.json(stateSnapshot())
  }),

  control('post', '/faults', async (request) => {
    const { rule } = await readBody(request, faultInputSchema)

    getDb().runtime.customRules.push(rule)
    return HttpResponse.json(stateSnapshot())
  }),

  control('delete', '/faults', () => {
    getDb().runtime.customRules = []
    return HttpResponse.json(stateSnapshot())
  }),

  control('patch', '/nfts/:id', async (request) => {
    const { editionId, ...changes } = await readBody(request, nftUpdateInputSchema)
    return HttpResponse.json(toDetail(updateEdition(pathSegment(request, -1), editionId, changes)))
  }),

  control('post', '/orders/:id/settle', async (request) => {
    const { outcome } = await readBody(request, settleInputSchema)
    const orderId = pathSegment(request, -2)
    const record = getDb().orders.find(({ order }) => order.id === orderId)

    if (!record) throw notFound('Pedido inexistente.')
    return HttpResponse.json({ changed: settleOrder(record, outcome), order: record.order })
  }),

  control('post', '/session/expire', () => {
    expireCurrentSession()
    closeAllConnections()
    return HttpResponse.json(stateSnapshot())
  }),

  control('post', '/socket', async (request) => {
    const { action } = await readBody(request, socketInputSchema)
    const { runtime } = getDb()

    if (action === 'up') runtime.socketDown = false
    if (action === 'down') runtime.socketDown = true
    if (action !== 'up') closeAllConnections()
    return HttpResponse.json(stateSnapshot())
  }),

  control('post', '/socket/replay', async (request) => {
    const { eventId } = await readBody(request, replayInputSchema)

    if (!replayEvent(eventId)) throw notFound('Evento inexistente no histórico.')
    return HttpResponse.json({ replayed: eventId })
  }),
]
