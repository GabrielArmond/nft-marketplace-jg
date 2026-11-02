import {
  buy,
  confirmButton,
  expectReceipt,
  onOrderPage,
  openReview,
  pay,
  readyToPay,
} from './support/checkout.ts'
import { ANNA, EMERALD, expect, GABRIEL, GOLDEN, test } from './support/fixtures.ts'

test.describe('fluxo 6: compra completa', () => {
  test('do catálogo ao recibo confirmado', async ({ app }) => {
    const { page } = app
    await app.open('/')
    await app.cards().filter({ hasText: EMERALD.name }).getByRole('link').first().click()
    await page.getByRole('heading', { level: 1, name: EMERALD.name }).waitFor()

    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).filter({ visible: true }).first().click()
    await app.expectCartCount(1)
    await app.goto('/carrinho')
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await app.fillLogin(ANNA)
    await page.waitForURL((url) => url.pathname === '/pagamento')
    await page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()

    await expect(page.getByLabel('Nome de exibição')).toHaveValue(ANNA.name)
    await page.getByRole('button', { name: /^Conectar / }).first().click()
    await page.getByRole('button', { name: /^Desconectar / }).first().waitFor()
    await expect(confirmButton(app)).toBeEnabled()
    await app.expectNoHorizontalOverflow()

    await openReview(app)
    await expect(page.getByRole('dialog').getByText(ANNA.email)).toBeVisible()
    await pay(app)
    await onOrderPage(app)
    await expectReceipt(app)

    await expect(page.getByText(EMERALD.name)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver no explorador' })).toBeVisible()
    await expect(page.getByText(/Transação simulada/)).toBeVisible()
    await app.expectNoHorizontalOverflow()
    await expect.poll(() => app.mock.cartLines()).toEqual([])

    await page.reload()
    await expectReceipt(app)
  })

  test('recibo usa a data do relógio do servidor (mock_clock)', async ({ app }) => {
    await readyToPay(app, { clock: '2027-03-04T15:00:00.000Z', account: GABRIEL })
    await buy(app)
    await expectReceipt(app)
    await expect(app.page.getByText('04/03/2027')).toBeVisible()
  })

  test('recibo reproduz o pedido mesmo depois de o catálogo mudar', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { account: GABRIEL })
    await buy(app)
    await expectReceipt(app)
    const receipt = page.locator('main article')
    const before = await receipt.textContent()

    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { priceEth: '9.99' })
    await page.reload()
    await expectReceipt(app)
    await expect(receipt).toHaveText(before ?? '')
    await expect(receipt).not.toContainText('9.99')
  })

  test('remove do carrinho só o que foi comprado', async ({ app }) => {
    await readyToPay(app, {
      account: GABRIEL,
      scenario: 'payment-pending',
      items: [
        { id: EMERALD.id, edition: EMERALD.edition, quantity: 1 },
        { id: GOLDEN.id, edition: GOLDEN.edition, quantity: 1 },
      ],
    })
    const orderId = await buy(app)
    await app.page.getByRole('heading', { name: 'Pagamento em processamento' }).waitFor()

    await app.mock.addToCart(EMERALD.id, EMERALD.edition, 1)
    await app.mock.settleOrder(orderId, 'confirmed')
    await expectReceipt(app)

    await expect
      .poll(async () => (await app.mock.cartLines()).map(({ nftId, quantity }) => [nftId, quantity]))
      .toEqual([[EMERALD.id, 1]])
  })

  test('rascunho sobrevive ao refresh e a revisão não cria pedido', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { account: GABRIEL })
    const note = page.getByLabel('Observação do colecionador (opcional)')
    await note.fill('entregar rápido')

    await openReview(app)
    await page.getByRole('button', { name: 'Voltar e editar' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    expect(await app.mock.orderCount()).toBe(0)

    await page.reload()
    await page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
    await expect(note).toHaveValue('entregar rápido')
  })

  test('rede sem carteira é tratada e a carteira segue a rede', async ({ app }) => {
    const { page } = app
    await readyToPay(app)

    await page.getByLabel('Rede').selectOption('solana')
    await expect(page.getByText('Nenhuma carteira selecionada para a rede Solana.')).toBeVisible()
    await confirmButton(app).click()
    await expect(page.getByText('Selecione uma carteira.')).toBeVisible()

    await page.getByLabel('Rede').selectOption('polygon')
    await expect(page.getByLabel('Tipo de carteira')).toHaveValue('Coinbase Wallet')
    await page.getByLabel('Usar outra carteira?').click()
    await expect(page.getByLabel('Rede')).toHaveValue('ethereum')
  })

  test('carteira recusada, conectada e desconectada', async ({ app }) => {
    const { page } = app
    await app.signedIn('/pagamento', ANNA, { scenario: 'wallet-refused' })
    await page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
    await expect(confirmButton(app)).toBeEnabled()

    await confirmButton(app).click()
    await expect(page.getByText('Conecte a carteira para continuar.')).toBeVisible()
    await expect(page.getByRole('dialog')).toBeHidden()

    const connect = page.getByRole('button', { name: 'Conectar Carteira principal' })
    await connect.click()
    await expect(page.getByRole('alert').filter({ hasText: 'A conexão foi recusada na carteira.' })).toBeVisible()

    await app.mock.setScenario('instant')
    await connect.click()
    await page.getByRole('button', { name: 'Desconectar Carteira principal' }).click()
    await expect(connect).toBeVisible()
  })

  test('acesso direto a pedido de outra conta ou inexistente', async ({ app }) => {
    const { page } = app
    await readyToPay(app)
    const orderId = await buy(app)
    await expectReceipt(app)

    await app.mock.logout()
    await app.mock.login(GABRIEL)
    await app.goto(`/pedido/${orderId}`)
    await page.getByRole('heading', { name: 'Este pedido é de outra conta' }).waitFor()
    await expect(page.getByText(EMERALD.name)).toHaveCount(0)

    await app.goto('/pedido/ord_inexistente')
    await page.getByRole('heading', { name: 'Pedido não encontrado' }).waitFor()
  })
})
