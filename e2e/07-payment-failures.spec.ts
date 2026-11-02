import { buy, confirmButton, expectReceipt, onOrderPage, openReview, pay, readyToPay } from './support/checkout.ts'
import { ANNA, expect, QUOTE_LIFETIME_MS, test, type App } from './support/fixtures.ts'

function resumeButton(app: App) {
  return app.page.getByRole('button', { name: 'Retomar compra' })
}

test.describe('fluxo 7: falha de pagamento, clique repetido e timeout', () => {
  test('pagamento recusado preserva os itens, é terminal e permite nova compra', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { scenario: 'payment-refused' })
    await buy(app)

    await page.getByRole('heading', { name: 'Pagamento recusado' }).waitFor()
    await expect(page.getByText(/continuam no carrinho/)).toBeVisible()
    expect(await app.mock.cartLines()).toHaveLength(2)

    await app.mock.setScenario('instant')
    await page.reload()
    await page.getByRole('heading', { name: 'Pagamento recusado' }).waitFor()

    await page.getByRole('link', { name: 'Voltar ao pagamento' }).click()
    await page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
    await expect(confirmButton(app)).toBeEnabled()
    await buy(app)
    await expectReceipt(app)

    const statuses = (await app.mock.orders()).map(({ status }) => status).toSorted()
    expect(statuses).toEqual(['confirmed', 'refused'])
  })

  test('clique repetido em confirmar cria um único pedido', async ({ app }) => {
    await readyToPay(app)
    await openReview(app)
    await app.page.getByRole('button', { name: 'Confirmar pagamento' }).dblclick()
    await onOrderPage(app)
    await expectReceipt(app)
    expect(await app.mock.orderCount()).toBe(1)
  })

  test('cliques no mesmo instante também criam um único pedido', async ({ app }) => {
    await readyToPay(app)
    await openReview(app)
    await app.page.getByRole('button', { name: 'Confirmar pagamento' }).evaluate((button) => {
      if (button instanceof HTMLElement) {
        button.click()
        button.click()
        button.click()
      }
    })
    await onOrderPage(app)
    await expectReceipt(app)
    expect(await app.mock.orderCount()).toBe(1)
  })

  test('timeout depois de criar o pedido recupera o mesmo pedido após refresh', async ({ app }) => {
    test.slow()
    const { page } = app
    await readyToPay(app, { scenario: 'order-timeout-after-create' })
    await openReview(app)
    await pay(app)

    await expect(resumeButton(app)).toBeVisible({ timeout: 20_000 })
    expect(await app.mock.orderCount()).toBe(1)
    await expect(confirmButton(app)).toBeDisabled()

    await page.reload()
    await resumeButton(app).click()
    await onOrderPage(app)
    await expectReceipt(app)
    expect(await app.mock.orderCount()).toBe(1)
  })

  test('resposta perdida recupera o mesmo pedido', async ({ app }) => {
    await readyToPay(app, { scenario: 'order-response-lost' })
    await openReview(app)
    await pay(app)

    await expect(resumeButton(app)).toBeVisible()
    await resumeButton(app).click()
    await onOrderPage(app)
    await expectReceipt(app)
    expect(await app.mock.orders()).toHaveLength(1)
  })

  test('chave reutilizada com outro conteúdo é tratada', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { scenario: 'order-response-lost' })
    await openReview(app)
    await pay(app)
    await expect(resumeButton(app)).toBeVisible()

    await page.evaluate(() => {
      const key = Object.keys(sessionStorage).find((name) => name.startsWith('kurio.checkout.attempt.'))
      if (!key) throw new Error('No stored attempt.')
      const attempt = JSON.parse(sessionStorage.getItem(key) ?? '{}') as {
        input: { collector: { note?: string } }
      }
      attempt.input.collector.note = 'outro conteúdo'
      sessionStorage.setItem(key, JSON.stringify(attempt))
    })
    await page.reload()
    await resumeButton(app).click()

    await expect(page.getByText('Esta tentativa já foi usada com outros dados.')).toBeVisible()
    expect(await app.mock.orderCount()).toBe(1)
  })

  test('sessão expirada no envio preserva dados e a tentativa', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { scenario: 'session-expires-on-checkout' })
    await page.getByLabel('Observação do colecionador (opcional)').fill('nota preservada')
    await openReview(app)
    await pay(app)

    await expect(page.getByRole('alert').filter({ hasText: 'sessão expirou' })).toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/login')

    await app.fillLogin(ANNA)
    await page.waitForURL((url) => url.pathname === '/pagamento')
    await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue('nota preservada')

    await resumeButton(app).click()
    await onOrderPage(app)
    await expectReceipt(app)
    const [order] = await app.mock.orders()
    expect(order?.receipt?.collector.note).toBe('nota preservada')
    expect(await app.mock.orderCount()).toBe(1)
  })

  test('retomar com cotação expirada exige nova revisão e não cria pedido antigo', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { scenario: 'session-expires-on-checkout' })
    await openReview(app)
    await pay(app)
    await expect(page.getByRole('alert').filter({ hasText: 'sessão expirou' })).toBeVisible()

    await app.fillLogin(ANNA)
    await page.waitForURL((url) => url.pathname === '/pagamento')
    await expect(resumeButton(app)).toBeVisible()
    await app.mock.advanceClock(QUOTE_LIFETIME_MS)

    await resumeButton(app).click()
    await expect(page.getByText('Os valores mudaram. Revise a nova cotação para continuar.')).toBeVisible()
    await expect(resumeButton(app)).toBeHidden()
    expect(await app.mock.orderCount()).toBe(0)

    await expect(confirmButton(app)).toBeEnabled()
    await buy(app)
    await expectReceipt(app)
    expect(await app.mock.orderCount()).toBe(1)
  })

  test('cotação vencida antes da revisão é renovada', async ({ app }) => {
    await readyToPay(app)
    await app.mock.advanceClock(QUOTE_LIFETIME_MS)
    await buy(app)
    await expectReceipt(app)
  })
})
