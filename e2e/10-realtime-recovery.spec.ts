import { buy, expectReceipt, RECEIPT_HEADING, readyToPay } from './support/checkout.ts'
import { ANNA, EMERALD, expect, GABRIEL, test, type App } from './support/fixtures.ts'

const PROCESSING = 'Pagamento em processamento'

function processing(app: App) {
  return app.page.getByRole('heading', { name: PROCESSING })
}

test.describe('fluxo 10: eventos duplicados ou antigos, desconexão e pedido pendente', () => {
  for (const scenario of ['duplicate-events', 'stale-events']) {
    test(`${scenario}: pedido fica confirmado e o efeito não se repete`, async ({ app }) => {
      await readyToPay(app, { scenario })
      await app.socketReady()

      await buy(app)
      await expectReceipt(app)
      await expect.poll(() => app.mock.cartLines()).toEqual([])

      await expect(processing(app)).toHaveCount(0)
      expect(await app.mock.orderCount()).toBe(1)
    })
  }

  test('evento antigo reenviado não regride um pedido confirmado', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { scenario: 'payment-pending' })
    await app.socketReady()
    const orderId = await buy(app)
    await expect(processing(app)).toBeVisible()

    await app.mock.settleOrder(orderId, 'confirmed')
    await expectReceipt(app)

    const { events } = await app.mock.state()
    const stale = events.find(({ type, version, resource }) => type === 'order.updated' && version === 1 && resource.id === orderId)
    expect(stale, 'the pending event must exist').toBeDefined()
    await app.mock.replayEvent(stale?.id ?? '')

    await expect(page.getByRole('heading', { name: RECEIPT_HEADING })).toBeVisible()
    await expect(processing(app)).toHaveCount(0)
  })

  test('pendente sobrevive ao refresh, não permite outra compra e chega pelo evento', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { scenario: 'payment-pending' })
    await app.socketReady()
    const orderId = await buy(app)
    await expect(processing(app)).toBeVisible()

    await page.reload()
    await expect(processing(app)).toBeVisible()

    await app.goto('/pagamento')
    await page.waitForURL((url) => url.pathname === `/pedido/${orderId}`)
    expect(await app.mock.orderCount()).toBe(1)

    await app.socketReady()
    await app.mock.settleOrder(orderId, 'confirmed')
    await expectReceipt(app, 3_000)
  })

  test('pendente recusado chega à tela própria', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { scenario: 'payment-pending' })
    await app.socketReady()
    const orderId = await buy(app)
    await expect(processing(app)).toBeVisible()

    await app.mock.settleOrder(orderId, 'refused')
    await page.getByRole('heading', { name: 'Pagamento recusado' }).waitFor()
    expect(await app.mock.cartLines()).toHaveLength(2)
  })

  test('conexão cai com pedido pendente: REST reconcilia ao voltar', async ({ app }) => {
    await readyToPay(app, { scenario: 'payment-pending' })
    await app.socketReady()
    const orderId = await buy(app)
    await expect(processing(app)).toBeVisible()

    await app.mock.socket('down')
    await app.socketReady(0)
    await app.mock.settleOrder(orderId, 'confirmed')
    await app.mock.socket('up')

    await expectReceipt(app)
    expect(await app.mock.orderCount()).toBe(1)
  })

  test('socket-down: a compra termina só com REST', async ({ app }) => {
    await readyToPay(app, { scenario: 'socket-down' })
    await buy(app)
    await expectReceipt(app, 12_000)
  })

  test('carrinho reconcilia preço perdido durante a queda', async ({ app }) => {
    const { page } = app
    await app.open('/')
    await app.mock.addToCart(EMERALD.id, EMERALD.edition, 2)
    await app.goto('/carrinho')
    await page.locator('main li').first().waitFor()
    await app.socketReady()

    await app.mock.socket('down')
    await app.socketReady(0)
    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { priceEth: '2' })
    await app.mock.socket('up')

    await expect(page.locator('aside dl > div').last()).toContainText('4.016 ETH')
  })

  test('ciclo de sessão não acumula conexões', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    await app.socketReady()

    await page.getByRole('button', { name: 'Sair' }).click()
    await page.waitForURL((url) => url.pathname === '/')
    await app.socketReady()

    await app.loginTrigger().click()
    await app.fillLogin(GABRIEL)
    await app.expectSignedIn(GABRIEL)
    await app.socketReady()
  })

  test('listeners são liberados: sair e voltar não multiplica a reação ao evento', async ({ app }) => {
    const { page } = app
    await app.signedIn('/carrinho', ANNA)
    await page.locator('main li').first().waitFor()
    await app.socketReady()

    for (let visit = 0; visit < 3; visit += 1) {
      await page.getByRole('link', { name: 'Continuar explorando' }).click()
      await page.waitForURL((url) => url.pathname === '/')
      await app.cartLink(2).click()
      await page.locator('main li').first().waitFor()
    }

    const cartReads: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'GET' && /\/api\/cart$/.test(request.url())) cartReads.push(request.url())
    })
    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { priceEth: '2' })
    await expect(page.locator('main [role=status]').filter({ hasText: 'mudou para 2.00 ETH' })).toBeVisible()
    await expect(page.locator('aside dl > div').last()).toContainText('4.016 ETH')

    expect(cartReads, 'one refetch per event, however many visits happened').toHaveLength(1)
  })
})
