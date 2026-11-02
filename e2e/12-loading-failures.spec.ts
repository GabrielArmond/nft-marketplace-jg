import { ANNA, EMERALD, expect, test, type App } from './support/fixtures.ts'

/** Same scenario, slower: the page takes seconds to boot under load and the window was small. */
const SLOW = { scenario: 'slow', latency: 6_000 }

function skeletons(app: App) {
  return app.page.locator('main [data-slot=skeleton]')
}

function failing(path: string) {
  return {
    id: 'fail',
    method: 'GET',
    path,
    phase: 'before',
    action: { kind: 'http', status: 500, code: 'SERVICE_UNAVAILABLE', message: 'Falha.' },
  } as const
}

test.describe('fluxo 12: skeletons, falha e nova tentativa', () => {
  test('catálogo mostra skeleton e depois os cards', async ({ app }) => {
    await app.open('/', SLOW)
    await expect(
      app.page.locator('#catalogo [data-slot=skeleton]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expect(app.cards()).toHaveCount(9, { timeout: 20_000 })
  })

  test('detalhe mostra skeleton e depois o NFT', async ({ app }) => {
    await app.open(`/nft/${EMERALD.id}`, SLOW)
    await expect(skeletons(app).first()).toBeVisible()
    await app.page.getByRole('heading', { level: 1, name: EMERALD.name }).waitFor({ timeout: 20_000 })
  })

  test('carrinho mostra skeleton', async ({ app }) => {
    await app.open('/carrinho', SLOW)
    await expect(skeletons(app).first()).toBeVisible()
  })

  for (const path of ['/pagamento', '/perfil', '/carteiras']) {
    test(`${path} mostra skeleton com latência alta`, async ({ app }) => {
      await app.signedIn('/', ANNA)
      await app.mock.setScenario('slow', SLOW.latency)
      await app.page.goto(path)
      await expect(skeletons(app).first()).toBeVisible()
    })
  }

  test('catálogo: falha com nova tentativa e recuperação', async ({ app }) => {
    const { page } = app
    await app.open('/', { scenario: 'flaky-connection' })
    await expect(app.cards().first()).toBeVisible({ timeout: 15_000 })

    await app.mock.addFault(failing('^/nfts'))
    await page.reload()
    const retry = page.getByRole('button', { name: 'Tentar novamente' }).first()
    await expect(retry).toBeVisible({ timeout: 15_000 })

    await app.mock.clearFaults()
    await retry.click()
    await expect(app.cards().first()).toBeVisible()
  })

  test('detalhe: falha com nova tentativa', async ({ app }) => {
    const { page } = app
    await app.open('/')
    await app.mock.addFault(failing('^/nfts/'))
    await app.goto(`/nft/${EMERALD.id}`)
    const retry = page.getByRole('button', { name: 'Tentar novamente' }).first()
    await expect(retry).toBeVisible({ timeout: 15_000 })

    await app.mock.clearFaults()
    await retry.click()
    await page.getByRole('heading', { level: 1, name: EMERALD.name }).waitFor()
  })

  test('carrinho: erro 500 recupera na nova tentativa', async ({ app }) => {
    const { page } = app
    await app.open('/carrinho', { scenario: 'http-500' })
    await page.getByRole('heading', { name: 'Não foi possível carregar o carrinho' }).waitFor({ timeout: 15_000 })

    await app.mock.setScenario('instant')
    await page.getByRole('button', { name: 'Tentar novamente' }).first().click()
    await page.getByRole('heading', { name: 'Seu carrinho está vazio' }).waitFor()
  })

  for (const [path, title, ready] of [
    ['/perfil', 'Não foi possível carregar o perfil', 'Perfil do colecionador'],
    ['/carteiras', 'Não foi possível carregar as carteiras', 'Carteira principal'],
    ['/pagamento', 'Não foi possível carregar o pagamento', 'Perfil do colecionador'],
  ] as const) {
    test(`${path}: falha com nova tentativa`, async ({ app }) => {
      const { page } = app
      await app.signedIn('/', ANNA)
      await app.mock.addFault(failing('^/wallets$'))
      await page.goto(path)
      await page.getByRole('heading', { name: title }).waitFor({ timeout: 15_000 })

      await app.mock.clearFaults()
      await page.getByRole('button', { name: 'Tentar novamente' }).click()
      await page.getByRole('heading', { name: ready }).waitFor()
    })
  }

  test('sem conexão: o catálogo explica e volta quando a rede volta', async ({ app }) => {
    const { page } = app
    await app.open('/', { scenario: 'offline' })
    const retry = page.getByRole('button', { name: 'Tentar novamente' }).first()
    await expect(retry).toBeVisible({ timeout: 15_000 })

    await app.mock.setScenario('instant')
    await retry.click()
    await expect(app.cards().first()).toBeVisible()
  })

  test('acesso não autorizado não quebra a tela', async ({ app }) => {
    const { page } = app
    await app.signedIn('/', ANNA)
    await app.mock.setScenario('unauthorized-access')
    await page.goto('/carteiras')
    await page.getByRole('heading', { name: 'Não foi possível carregar as carteiras' }).waitFor({ timeout: 15_000 })
  })
})
