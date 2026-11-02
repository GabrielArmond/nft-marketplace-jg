import { ANNA, EMERALD, expect, GABRIEL, GOLDEN, test, type App } from './support/fixtures.ts'

function row(app: App, name: string) {
  return app.page.getByRole('region', { name: 'Itens do carrinho' }).getByRole('listitem').filter({ hasText: name })
}

function total(app: App) {
  return app.page.locator('aside dl > div').last().getByRole('definition')
}

function coupon(app: App) {
  return app.page.getByRole('textbox', { name: 'Código promocional' })
}

async function filledCart(app: App): Promise<void> {
  await app.open('/')
  await app.mock.addToCart(EMERALD.id, EMERALD.edition, 2)
  await app.mock.addToCart(GOLDEN.id, GOLDEN.edition, 1)
  await app.goto('/carrinho')
  await expect(row(app, EMERALD.name)).toBeVisible()
}

test.describe('fluxo 5: carrinho', () => {
  test('quantidade atualiza totais, respeita o estoque e sobrevive ao refresh', async ({ app }) => {
    const { page } = app
    await filledCart(app)
    await expect(total(app)).toHaveText('2.891 ETH')
    const item = row(app, EMERALD.name)
    const increase = item.getByRole('button', { name: 'Aumentar quantidade' })

    await increase.click()
    await expect(total(app)).toHaveText('4.081 ETH')
    await increase.click()
    await expect(total(app)).toHaveText('5.271 ETH')
    await increase.click()
    await expect(total(app)).toHaveText('6.461 ETH')
    await expect(increase, 'stops at the stock').toBeDisabled()

    await item.getByRole('button', { name: 'Diminuir quantidade' }).click()
    await expect(total(app)).toHaveText('5.271 ETH')

    await page.reload()
    await expect(total(app)).toHaveText('5.271 ETH')
    await app.expectCartCount(5)
  })

  test('remover item atualiza totais e o último leva ao estado vazio', async ({ app }) => {
    const { page } = app
    await filledCart(app)

    await row(app, GOLDEN.name).getByRole('button', { name: /Remover/ }).click()
    await expect(row(app, GOLDEN.name)).toHaveCount(0)
    await expect(total(app)).toHaveText('2.396 ETH')

    await row(app, EMERALD.name).getByRole('button', { name: /Remover/ }).click()
    await page.getByRole('heading', { name: 'Seu carrinho está vazio' }).waitFor()
    await expect(page.getByRole('link', { name: 'Explorar o catálogo' })).toBeVisible()
  })

  test('cupom inválido, expirado, válido e removido', async ({ app }) => {
    const { page } = app
    await filledCart(app)

    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Informe o código.' })).toBeVisible()

    await coupon(app).fill('NAOEXISTE')
    await coupon(app).press('Enter')
    await expect(page.getByText('Cupom inválido.').first()).toBeVisible()
    await expect(coupon(app)).toHaveAttribute('aria-invalid', 'true')

    await coupon(app).fill('LANCAMENTO')
    await coupon(app).press('Enter')
    await expect(page.getByText('Este cupom expirou.').first()).toBeVisible()

    await coupon(app).fill('kurio10')
    await coupon(app).press('Enter')
    await expect(total(app)).toHaveText('2.6035 ETH')

    await page.reload()
    await expect(total(app)).toHaveText('2.6035 ETH')

    await page.getByRole('button', { name: 'Remover cupom' }).click()
    await expect(total(app)).toHaveText('2.891 ETH')
  })

  test('cupom válido hoje expira com o relógio do servidor (mock_clock)', async ({ app }) => {
    await app.open('/', { clock: '2100-01-01T00:00:00.000Z' })
    await app.mock.addToCart(EMERALD.id, EMERALD.edition, 1)
    await app.goto('/carrinho')

    await coupon(app).fill('KURIO10')
    await coupon(app).press('Enter')
    await expect(app.page.getByText('Este cupom expirou.').first()).toBeVisible()
  })

  test('falha de quantidade mantém o valor e a próxima tentativa funciona', async ({ app }) => {
    const { page } = app
    await filledCart(app)
    await app.mock.addFault({
      id: 'quantity',
      method: 'PATCH',
      path: '^/cart/items/',
      phase: 'before',
      times: 1,
      action: { kind: 'http', status: 409, code: 'AVAILABILITY_CONFLICT', message: 'Restam apenas 2.' },
    })
    const increase = row(app, EMERALD.name).getByRole('button', { name: 'Aumentar quantidade' })

    await increase.click()
    await expect(page.getByRole('alert').filter({ hasText: 'Restam apenas 2' })).toBeVisible()
    await expect(row(app, EMERALD.name).locator('output')).toHaveText('2')

    await increase.click()
    await expect(total(app)).toHaveText('4.081 ETH')
  })

  test('carrinho salvo reaparece após login', async ({ app }) => {
    await app.open('/')
    await app.loginTrigger().click()
    await app.fillLogin(ANNA)
    await expect(app.cartLink(2)).toBeVisible()
    await app.page.reload()
    await expect(app.cartLink(2)).toBeVisible()
  })

  test('botão muda conforme a sessão e visitante continua após o login', async ({ app }) => {
    const { page } = app
    await filledCart(app)
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await page.getByRole('dialog').waitFor()
    expect(new URL(page.url()).pathname).toBe('/carrinho')

    await app.fillLogin(GABRIEL)
    await page.waitForURL((url) => url.pathname === '/pagamento')
    await page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()

    await app.goto('/carrinho')
    await expect(page.getByRole('link', { name: 'Finalizar', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Conectar e finalizar' })).toHaveCount(0)
  })
})
