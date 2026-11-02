import { test as base, expect, type Locator, type Page } from '@playwright/test'

import { MockApi } from './mock-api.ts'

export { expect }

export const ANNA = { email: 'anna@kurio.test', password: 'Kurio@2026', name: 'Anna Almeida' }
export const GABRIEL = {
  email: 'gabriel@kurio.test',
  password: 'Mint#2026',
  name: 'Gabriel Guerra',
}
export type Account = typeof ANNA

export const EMERALD = { id: 'emerald-ape-042', edition: 'emerald-ape-042:1-50', name: 'Emerald Ape #042' }
export const GOLDEN = { id: 'golden-beat-207', edition: 'golden-beat-207:open', name: 'Golden Beat #207' }

/** Long enough to outlive the five-minute quote and short of the one-hour session. */
export const QUOTE_LIFETIME_MS = 6 * 60_000

export interface OpenOptions {
  scenario?: string
  seed?: number
  latency?: number
  clock?: string
}

const IGNORED_CONSOLE = /Failed to load resource|WebSocket connection to|net::ERR_/

export class App {
  readonly page: Page
  readonly mock: MockApi
  readonly isMobile: boolean

  constructor(page: Page, isMobile: boolean) {
    this.page = page
    this.mock = new MockApi(page)
    this.isMobile = isMobile
  }

  /** Reset is per context, and each test has its own: storage and worker are not shared. */
  async open(path: string, options: OpenOptions = {}): Promise<void> {
    const { scenario = 'instant', seed, latency, clock } = options
    const params = new URLSearchParams({ mock_reset: '1', mock_scenario: scenario })

    if (seed !== undefined) params.set('mock_seed', seed.toString())
    if (latency !== undefined) params.set('mock_latency', latency.toString())
    if (clock !== undefined) params.set('mock_clock', clock)

    await this.page.goto(`${path}${path.includes('?') ? '&' : '?'}${params.toString()}`)
    await this.shell().waitFor()
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path)
    await this.shell().waitFor()
  }

  private shell(): Locator {
    return this.page.locator('#conteudo')
  }

  /** Starts signed in, optionally with items, on `path`. */
  async signedIn(
    path: string,
    account: Account = ANNA,
    options: OpenOptions & { items?: { id: string; edition: string; quantity: number }[] } = {},
  ): Promise<void> {
    const { items = [], ...open } = options

    await this.open('/', open)
    await this.mock.login(account)
    for (const { id, edition, quantity } of items) {
      await this.mock.addToCart(id, edition, quantity)
    }
    await this.goto(path)
  }

  /** The realtime client must be up before a test fires an event at it. */
  async socketReady(connections = 1): Promise<void> {
    await expect.poll(async () => (await this.mock.state()).socketConnections).toBe(connections)
  }

  loginTrigger(): Locator {
    return this.isMobile
      ? this.page.getByRole('link', { name: 'Perfil', exact: true }).filter({ visible: true })
      : this.page.getByRole('link', { name: 'Entrar', exact: true }).filter({ visible: true })
  }

  async fillLogin({ email, password }: Pick<Account, 'email' | 'password'>): Promise<void> {
    const dialog = this.page.getByRole('dialog')
    await dialog.getByLabel('E-mail', { exact: true }).fill(email)
    await dialog.getByLabel('Senha', { exact: true }).fill(password)
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  }

  /** Signed-in identity is on the header on desktop and in the session on mobile. */
  async expectSignedIn(account: Account): Promise<void> {
    if (!this.isMobile) {
      await expect(this.page.getByRole('link', { name: account.name })).toBeVisible()
      return
    }
    await expect
      .poll(async () => {
        const { body } = await this.mock.rest<{ user: { displayName: string } | null }>(
          'GET',
          '/auth/session',
        )
        return body.user?.displayName
      })
      .toBe(account.name)
  }

  async expectNoHorizontalOverflow(): Promise<void> {
    const excess = await this.page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(excess).toBeLessThanOrEqual(0)
  }

  cards(): Locator {
    return this.page.locator('#catalogo article')
  }

  cardNames(): Locator {
    return this.page.locator('#catalogo article h3')
  }

  /** By the API: purchase screens have no cart badge on mobile. */
  async expectCartCount(count: number): Promise<void> {
    await expect
      .poll(async () =>
        (await this.mock.cartLines()).reduce((total, { quantity }) => total + quantity, 0),
      )
      .toBe(count)
  }

  cartLink(count: number): Locator {
    const label = `Carrinho, ${count.toString()} ${count === 1 ? 'item' : 'itens'}`
    return this.page.getByRole('link', { name: label }).filter({ visible: true }).first()
  }
}

export const test = base.extend<{ app: App }>({
  app: async ({ page, isMobile }, use) => {
    const problems: string[] = []

    page.on('console', (message) => {
      const isProblem = message.type() === 'error' || message.type() === 'warning'
      if (isProblem && !IGNORED_CONSOLE.test(message.text())) problems.push(message.text())
    })
    page.on('pageerror', (error) => {
      problems.push(error.message)
    })

    await use(new App(page, isMobile))

    // Every flow doubles as a check that nothing was logged on the way.
    expect(problems, 'console errors during the test').toEqual([])
  },
})
