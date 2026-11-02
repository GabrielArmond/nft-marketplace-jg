import type { Page } from '@playwright/test'

export type Network = 'ethereum' | 'polygon' | 'solana'

export interface FaultRule {
  id: string
  method?: string
  path: string
  phase: 'before' | 'after'
  times?: number
  action:
    | { kind: 'http'; status: number; code: string; message: string }
    | { kind: 'network' }
    | { kind: 'hang' }
}

interface ControlState {
  orders: number
  socketConnections: number
  events: { id: string; type: string; version: number; resource: { id: string } }[]
  scenarios: { id: string }[]
}

export interface Order {
  id: string
  status: 'pending' | 'confirmed' | 'refused'
  receipt: { collector: { note?: string } } | null
}

export interface CartLine {
  id: string
  nftId: string
  editionId: string
  quantity: number
}

export interface Wallet {
  id: string
  role: 'primary' | 'secondary'
  label: string
}

interface Reply<Body> {
  status: number
  body: Body
}

/**
 * Talks to the simulated server the way the app does: `fetch` inside the page, so
 * every call crosses the service worker. Nothing here touches the UI's state.
 */
export class MockApi {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  private request<Body>(method: string, url: string, data?: unknown): Promise<Reply<Body>> {
    return this.page.evaluate(
      async ([verb, target, payload]) => {
        const response = await fetch(target, {
          method: verb,
          credentials: 'include',
          ...(payload === undefined
            ? {}
            : { body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } }),
        })
        const text = await response.text()
        return { status: response.status, body: (text ? JSON.parse(text) : null) as Body }
      },
      [method, url, data] as const,
    )
  }

  private async control<Body>(method: string, path: string, data?: unknown): Promise<Body> {
    const { body } = await this.request<Body>(method, `/__mock__${path}`, data)
    return body
  }

  /** Same-origin REST call, answered by the MSW handlers. */
  rest<Body>(method: string, path: string, data?: unknown): Promise<Reply<Body>> {
    return this.request<Body>(method, `/api${path}`, data)
  }

  state(): Promise<ControlState> {
    return this.control('GET', '/state')
  }

  async orderCount(): Promise<number> {
    return (await this.state()).orders
  }

  async setScenario(id: string, latencyMs?: number | null): Promise<void> {
    await this.control('POST', '/scenario', { id, ...(latencyMs === undefined ? {} : { latencyMs }) })
  }

  async addFault(rule: FaultRule): Promise<void> {
    await this.control('POST', '/faults', { rule })
  }

  async clearFaults(): Promise<void> {
    await this.control('DELETE', '/faults')
  }

  async advanceClock(advanceMs: number): Promise<void> {
    await this.control('POST', '/clock', { advanceMs })
  }

  async updateEdition(
    nftId: string,
    editionId: string,
    changes: { priceEth?: string; available?: number },
  ): Promise<void> {
    await this.control('PATCH', `/nfts/${nftId}`, { editionId, ...changes })
  }

  async settleOrder(orderId: string, outcome: 'confirmed' | 'refused'): Promise<void> {
    await this.control('POST', `/orders/${orderId}/settle`, { outcome })
  }

  async socket(action: 'disconnect' | 'down' | 'up'): Promise<void> {
    await this.control('POST', '/socket', { action })
  }

  async replayEvent(eventId: string): Promise<void> {
    await this.control('POST', '/socket/replay', { eventId })
  }

  async expireSession(): Promise<void> {
    await this.control('POST', '/session/expire')
  }

  async orders(): Promise<Order[]> {
    const { body } = await this.rest<{ items: Order[] }>('GET', '/orders')
    return body.items
  }

  async cartLines(): Promise<CartLine[]> {
    const { body } = await this.rest<{ items: CartLine[] }>('GET', '/cart')
    return body.items
  }

  async wallets(): Promise<Wallet[]> {
    const { body } = await this.rest<{ items: Wallet[] }>('GET', '/wallets')
    return body.items
  }

  async favoriteIds(): Promise<string[]> {
    const { body } = await this.rest<{ items: { id: string }[] }>('GET', '/favorites')
    return body.items.map(({ id }) => id)
  }

  async login(user: { email: string; password: string }): Promise<void> {
    await this.rest('POST', '/auth/login', user)
  }

  async logout(): Promise<void> {
    await this.rest('POST', '/auth/logout')
  }

  async addToCart(nftId: string, editionId: string, quantity: number): Promise<void> {
    await this.rest('POST', '/cart/items', { nftId, editionId, quantity })
  }
}
