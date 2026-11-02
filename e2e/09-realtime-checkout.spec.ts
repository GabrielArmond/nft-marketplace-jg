import { buy, confirmButton, expectReceipt, openReview, pay, readyToPay } from './support/checkout.ts'
import { EMERALD, expect, GOLDEN, test, type App } from './support/fixtures.ts'

function changes(app: App) {
  return app.page.getByRole('alert').filter({ hasText: 'Os valores mudaram' })
}

test.describe('fluxo 9: preço e disponibilidade via Socket.IO durante o checkout', () => {
  test('preço muda durante a navegação: informa, atualiza e exige aceite', async ({ app }) => {
    const { page } = app
    await readyToPay(app)
    await app.socketReady()

    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { priceEth: '3.33' })

    await expect(changes(app)).toBeVisible()
    await expect(changes(app)).toContainText(`O preço de ${EMERALD.name} mudou para`)
    await expect(page.getByText('9.99 ETH').first()).toBeVisible()
    await expect(confirmButton(app)).toBeDisabled()

    await page.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await expect(confirmButton(app)).toBeEnabled()
    await buy(app)
    await expectReceipt(app)
    await expect(page.locator('main article')).toContainText('9.99 ETH')
  })

  test('disponibilidade cai: bloqueia e leva ao carrinho, sem pedido', async ({ app }) => {
    const { page } = app
    await readyToPay(app)
    await app.socketReady()

    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { available: 1 })

    await expect(page.getByRole('link', { name: 'Ajustar carrinho' }).first()).toBeVisible()
    await expect(confirmButton(app)).toBeDisabled()
    expect(await app.mock.orderCount()).toBe(0)
  })

  test('mudança com a revisão aberta fecha a revisão', async ({ app }) => {
    const { page } = app
    await readyToPay(app)
    await app.socketReady()
    await openReview(app)

    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { priceEth: '4.44' })

    await expect(changes(app)).toBeVisible()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(changes(app), 'the buyer is taken to the change').toBeFocused()
  })

  test('preço muda no envio: nenhuma compra com cotação antiga', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { scenario: 'price-changed-on-checkout' })
    await openReview(app)
    await pay(app)

    await expect(changes(app)).toBeVisible()
    await expect(page.getByRole('dialog')).toBeHidden()
    expect(await app.mock.orderCount()).toBe(0)
    expect(new URL(page.url()).pathname).toBe('/pagamento')

    await page.getByRole('button', { name: 'Aceitar novos valores' }).click()
    await expect(confirmButton(app)).toBeEnabled()
    await buy(app)
    await expectReceipt(app)
    expect(await app.mock.orderCount()).toBe(1)
  })

  test('edição esgota no envio: bloqueia e preserva os itens', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { scenario: 'edition-sold-out-on-checkout' })
    await openReview(app)
    await pay(app)

    await expect(page.getByRole('link', { name: 'Ajustar carrinho' }).first()).toBeVisible()
    await expect(confirmButton(app)).toBeDisabled()
    expect(await app.mock.orderCount()).toBe(0)
    expect(await app.mock.cartLines()).toHaveLength(2)
  })

  test('carrinho aberto anuncia a mudança e bloqueia o estoque insuficiente', async ({ app }) => {
    const { page } = app
    await app.open('/')
    await app.mock.addToCart(EMERALD.id, EMERALD.edition, 2)
    await app.mock.addToCart(GOLDEN.id, GOLDEN.edition, 1)
    await app.goto('/carrinho')
    await page.locator('main li').first().waitFor()
    await app.socketReady()

    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { priceEth: '2' })
    await expect(page.locator('main [role=status]').filter({ hasText: `O preço de ${EMERALD.name} mudou para 2.00 ETH.` })).toBeVisible()

    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { available: 1 })
    await expect(page.getByRole('button', { name: 'Ajuste os itens para continuar' })).toBeDisabled()
  })

  test('detalhe e catálogo acompanham o evento sem recarregar', async ({ app }) => {
    const { page } = app
    await app.open(`/nft/${EMERALD.id}`)
    await page.getByRole('heading', { level: 1, name: EMERALD.name }).waitFor()
    await app.socketReady()

    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { priceEth: '7.77' })
    await expect(page.getByText('7.77 ETH').filter({ visible: true }).first()).toBeVisible()
  })
})
