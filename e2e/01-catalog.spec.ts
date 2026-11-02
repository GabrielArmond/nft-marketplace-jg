import { expect, test, type App } from './support/fixtures.ts'

/** The panel sits on the page on desktop and inside a dialog on mobile. */
async function toggleFilters(app: App, names: RegExp[]): Promise<void> {
  const { page } = app
  const openButton = page.getByRole('button', { name: /^Abrir filtros/ }).filter({ visible: true })
  const usesDialog = (await openButton.count()) > 0

  if (usesDialog) await openButton.first().click()
  const panel = usesDialog ? page.getByRole('dialog', { name: 'Filtros' }) : page.locator('#catalogo')
  await panel.waitFor()
  for (const name of names) {
    // The native input is visually hidden: people click its label.
    await panel.locator('label').filter({ hasText: name }).first().click()
  }
  if (usesDialog) await page.getByRole('button', { name: /^Ver \d* ?resultados?/ }).click()
}

function search(app: App): URLSearchParams {
  return new URL(app.page.url()).searchParams
}

test.describe('fluxo 1: busca, filtros, ordenação, paginação e histórico', () => {
  test('filtros combinados, ordenação e paginação ficam na URL e voltam pelo histórico', async ({
    app,
  }) => {
    const { page } = app
    await app.open('/')
    await expect(app.cards()).toHaveCount(9)
    await expect(app.cardNames().first()).toHaveText('Emerald Ape #042')

    await page.getByRole('link', { name: 'Página 2' }).click()
    await page.waitForURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
    const secondPage = await app.cardNames().allTextContents()
    expect(secondPage).not.toContain('Emerald Ape #042')

    await toggleFilters(app, [/^Música/])
    await page.waitForURL((url) => url.searchParams.has('categories'))
    expect(search(app).has('page'), 'a new filter returns to the first page').toBe(false)

    await toggleFilters(app, [/^Polygon/])
    await page.waitForURL((url) => url.searchParams.has('networks'))
    await expect(app.cards().first()).toBeVisible()
    const filtered = await app.cardNames().allTextContents()
    expect(filtered.length).toBeGreaterThan(0)

    await page.reload()
    await expect(app.cardNames()).toHaveText(filtered)

    await page.goBack()
    await page.waitForURL((url) => !url.searchParams.has('networks'))
    await expect(app.cards().first()).toBeVisible()
    await page.goForward()
    await page.waitForURL((url) => url.searchParams.has('networks'))
    await expect(app.cardNames()).toHaveText(filtered)
  })

  test('ordenação por preço respeita a API e sobrevive ao refresh', async ({ app }) => {
    const { page } = app
    await app.open('/?sort=price_desc')
    await expect(app.cards()).toHaveCount(9)

    const prices = await page
      .locator('#catalogo article p span:not(.sr-only)')
      .filter({ hasText: 'ETH' })
      .allTextContents()
    const values = prices.map((text) => Number.parseFloat(text))
    expect(values.length).toBeGreaterThan(0)
    expect(values[0]).toBeGreaterThanOrEqual(values.at(-1) ?? 0)

    await page.reload()
    await expect(app.cards()).toHaveCount(9)
    expect(search(app).get('sort')).toBe('price_desc')
  })

  test('busca com debounce envia uma requisição e mantém texto numérico', async ({
    app,
    isMobile,
  }) => {
    const { page } = app
    await app.open('/')
    await expect(app.cards().first()).toBeVisible()

    const queries: string[] = []
    page.on('request', (request) => {
      if (/\/api\/nfts\?.*q=/.test(request.url())) queries.push(request.url())
    })
    const box = page.getByRole('searchbox', { name: 'Buscar NFTs' }).filter({ visible: true })
    if (!(await box.count())) await page.getByRole('button', { name: 'Buscar no catálogo' }).click()
    await box.pressSequentially('042', { delay: 30 })
    // The header search of the desktop applies on Enter; the page one is debounced.
    if (!isMobile) await box.press('Enter')
    await page.waitForURL(/q=/)
    await expect(app.cardNames().first()).toContainText('042')
    expect(queries).toHaveLength(1)

    await page.reload()
    await expect(app.cardNames().first()).toContainText('042')
  })

  test('parâmetros inválidos são ignorados e uma página além do fim se recupera', async ({ app }) => {
    const { page } = app
    await app.open('/?sort=x&page=-1&categories=%5B%22nope%22%5D&minPriceEth=abc&tab=z')
    await expect(app.cards()).toHaveCount(9)

    await app.goto('/?page=99')
    await page.getByRole('heading', { name: 'Esta página não existe' }).waitFor()
    await page.getByRole('link', { name: 'Ir para a primeira página' }).click()
    await expect(app.cards()).toHaveCount(9)
  })

  test('resposta antiga que chega depois não substitui a mais recente', async ({ app }) => {
    const { page } = app
    await app.open('/', { scenario: 'out-of-order' })
    await expect(app.cards().first()).toBeVisible({ timeout: 15_000 })
    const { body } = await app.mock.rest<{ items: { name: string }[] }>(
      'GET',
      '/nfts?tab=trending&page=1&pageSize=9',
    )
    const latest = body.items.map(({ name }) => name)

    await page.getByRole('link', { name: 'Novos lançamentos' }).click()
    await page.getByRole('link', { name: 'Em alta' }).click()

    await page.waitForURL(/tab=trending/)
    await expect(app.cardNames()).toHaveText(latest, { timeout: 15_000 })
  })

  test('busca sem resultado oferece saída', async ({ app }) => {
    const { page } = app
    await app.open('/?q=zzzz')
    await page.getByRole('heading', { name: 'Nenhum NFT encontrado' }).waitFor()
    await page.getByRole('link', { name: 'Limpar busca e filtros' }).click()
    await expect(app.cards()).toHaveCount(9)
  })

  test('catálogo vazio mostra o estado próprio', async ({ app }) => {
    await app.open('/', { scenario: 'empty-catalog' })
    await app.page.getByRole('heading', { name: 'Nenhum NFT encontrado' }).waitFor()
  })
})
