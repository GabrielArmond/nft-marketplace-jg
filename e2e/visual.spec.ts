import { confirmButton } from './support/checkout.ts'
import { EMERALD, expect, GABRIEL, GOLDEN, test, type App } from './support/fixtures.ts'

/** Baselines come from the seed and a frozen server clock, so data never drifts. */
const STABLE = { seed: 1, clock: '2026-06-15T12:00:00.000Z' }

// Font rendering differs between systems: baselines only hold on the OS that made them.
test.skip(process.platform !== 'linux', 'Baselines are Linux only: run test:e2e:update elsewhere.')
test.use({ contextOptions: { reducedMotion: 'reduce' } })

/** Lazy images must be in, or a full-page capture depends on how far it scrolled. */
async function settle(app: App): Promise<void> {
  const { page } = app

  await page.evaluate(async () => {
    for (const image of document.querySelectorAll('img')) image.loading = 'eager'
    await document.fonts.ready
    await Promise.all(
      [...document.querySelectorAll('img')].map((image) => image.decode().catch(() => undefined)),
    )
  })
  await page.evaluate(() => {
    window.scrollTo(0, 0)
  })
}

test.describe('regressão visual', () => {
  test('início', async ({ app }) => {
    await app.open('/', STABLE)
    await expect(app.cards()).toHaveCount(9)
    await settle(app)
    await expect(app.page).toHaveScreenshot('home.png', { fullPage: true })
  })

  test('detalhe', async ({ app }) => {
    await app.open(`/nft/${EMERALD.id}`, STABLE)
    await app.page.getByRole('heading', { level: 1, name: EMERALD.name }).waitFor()
    await expect(app.page.getByRole('group', { name: /lista com rolagem horizontal/ }).locator('article').first()).toBeVisible()
    await settle(app)
    await expect(app.page).toHaveScreenshot('detail.png', { fullPage: true })
  })

  test('carrinho', async ({ app }) => {
    await app.open('/', STABLE)
    await app.mock.addToCart(EMERALD.id, EMERALD.edition, 2)
    await app.mock.addToCart(GOLDEN.id, GOLDEN.edition, 1)
    await app.goto('/carrinho')
    await expect(app.page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('listitem')).toHaveCount(2)
    await expect(app.page.getByRole('group', { name: /lista com rolagem horizontal/ }).locator('article').first()).toBeVisible()
    await settle(app)
    await expect(app.page).toHaveScreenshot('cart.png', { fullPage: true })
  })

  test('pagamento', async ({ app }) => {
    await app.signedIn('/pagamento', GABRIEL, {
      ...STABLE,
      items: [
        { id: EMERALD.id, edition: EMERALD.edition, quantity: 1 },
        { id: GOLDEN.id, edition: GOLDEN.edition, quantity: 1 },
      ],
    })
    await app.page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
    await expect(confirmButton(app)).toBeEnabled()
    await settle(app)
    await expect(app.page).toHaveScreenshot('payment.png', { fullPage: true })
  })

  test('perfil', async ({ app }) => {
    await app.signedIn('/perfil', GABRIEL, STABLE)
    await app.page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
    await settle(app)
    await expect(app.page).toHaveScreenshot('profile.png', { fullPage: true })
  })

  test('carteiras', async ({ app }) => {
    await app.signedIn('/carteiras', GABRIEL, STABLE)
    await app.page.getByRole('heading', { name: 'Carteira principal' }).waitFor()
    await settle(app)
    await expect(app.page).toHaveScreenshot('wallets.png', { fullPage: true })
  })
})
