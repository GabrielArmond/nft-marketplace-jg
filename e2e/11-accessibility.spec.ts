import { buy, confirmButton, expectReceipt, readyToPay } from './support/checkout.ts'
import { EMERALD, expect, GABRIEL, test, type App } from './support/fixtures.ts'

async function tabUntil(app: App, accessibleText: string, limit = 40): Promise<void> {
  for (let press = 0; press < limit; press += 1) {
    await app.page.keyboard.press('Tab')
    const text = await app.page.evaluate(
      () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent ?? '',
    )
    if (text.trim() === accessibleText) return
  }
  throw new Error(`"${accessibleText}" not reachable with Tab.`)
}

async function expectFocusTrapped(app: App, presses = 12): Promise<void> {
  for (let press = 0; press < presses; press += 1) {
    await app.page.keyboard.press('Tab')
    const inside = await app.page.evaluate(() => Boolean(document.activeElement?.closest('[role=dialog]')))
    expect(inside).toBe(true)
  }
}

test.describe('fluxo 11: teclado, foco de diálogos e formulários', () => {
  test('skip link leva ao conteúdo', async ({ app }) => {
    const { page } = app
    await app.open('/')
    await expect(app.cards().first()).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#conteudo')).toBeFocused()
  })

  test('diálogo de login prende o foco e devolve ao gatilho', async ({ app }) => {
    const { page } = app
    await app.open('/')
    await expect(app.cards().first()).toBeVisible()
    await app.loginTrigger().focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByLabel('E-mail', { exact: true })).toBeFocused()
    await expectFocusTrapped(app)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(app.loginTrigger()).toBeFocused()
  })

  test('formulário de login associa erros aos campos', async ({ app }) => {
    const { page } = app
    await app.open('/login')
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

    const email = dialog.getByLabel('E-mail', { exact: true })
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAttribute('aria-describedby', /.+/)

    await dialog.getByRole('button', { name: 'Mostrar senha' }).click()
    await expect(dialog.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text')
  })

  test('diálogo de filtros prende o foco e devolve ao gatilho', async ({ app, isMobile }) => {
    test.skip(!isMobile, 'Filters live in a dialog only on mobile.')
    const { page } = app
    await app.open('/')
    await expect(app.cards().first()).toBeVisible()
    const opener = page.getByRole('button', { name: /^Abrir filtros/ }).first()

    await opener.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('dialog', { name: 'Filtros' }).waitFor()
    await expectFocusTrapped(app, 6)
    await page.keyboard.press('Escape')
    await expect(opener).toBeFocused()
  })

  test('catálogo é navegável por teclado até o detalhe', async ({ app, isMobile }) => {
    test.skip(isMobile, 'Keyboard browsing of the whole page is a desktop path.')
    const { page } = app
    await app.open('/')
    await expect(app.cards().first()).toBeVisible()
    await app.cards().first().getByRole('link').first().focus()
    await page.keyboard.press('Enter')
    await page.waitForURL(/\/nft\//)
  })

  test('detalhe: edição, abas e zoom por teclado', async ({ app, isMobile }) => {
    const { page } = app
    await app.open(`/nft/${EMERALD.id}`)
    await page.getByRole('heading', { level: 1, name: EMERALD.name }).waitFor()

    const selected = page.getByRole('radio', { checked: true }).filter({ visible: true }).first()
    await selected.focus()
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('radio', { name: /^1\/1 / }).first()).not.toBeChecked()

    const details = page.getByRole('tab', { name: 'Detalhes do NFT' })
    await details.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: /Avaliações/ })).toHaveAttribute('aria-selected', 'true')

    test.skip(isMobile, 'The zoom button is desktop only.')
    const zoom = page.getByRole('button', { name: /Ampliar imagem/ })
    await zoom.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('dialog').waitFor()
    await page.keyboard.press('Escape')
    await expect(zoom).toBeFocused()
  })

  test('compra completa por teclado', async ({ app }) => {
    const { page } = app
    await readyToPay(app, { account: GABRIEL })

    await confirmButton(app).focus()
    await page.keyboard.press('Enter')
    const review = page.getByRole('dialog', { name: 'Revise sua compra' })
    await review.waitFor()
    await expectFocusTrapped(app, 6)

    await page.keyboard.press('Escape')
    await expect(review).toBeHidden()
    await expect(confirmButton(app)).toBeFocused()

    await page.keyboard.press('Enter')
    await review.waitFor()
    await page.getByRole('button', { name: 'Confirmar pagamento' }).focus()
    await page.keyboard.press('Enter')
    await page.waitForURL((url) => url.pathname.startsWith('/pedido/'))
    await expectReceipt(app)
  })

  test('erro no pagamento leva o foco ao primeiro campo inválido', async ({ app }) => {
    const { page } = app
    await readyToPay(app)
    const name = page.getByLabel('Nome de exibição')

    await name.fill('')
    await confirmButton(app).click()
    await expect(page.getByText('Informe o nome de exibição.')).toBeVisible()
    await expect(name).toBeFocused()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('dialog')).toBeHidden()
    expect(await app.mock.orderCount()).toBe(0)
  })

  test('perfil chega ao salvar pelo teclado e menu tem ações com nome', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    const name = page.getByLabel('Nome de exibição')

    await name.focus()
    await page.keyboard.type(' X')
    await tabUntil(app, 'Salvar')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status').filter({ hasText: 'Alterações salvas.' })).toBeVisible()

    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('main button, main a')].filter(
        (element) => !(element.getAttribute('aria-label') ?? element.textContent).trim(),
      ).length,
    )
    expect(unnamed).toBe(0)
  })

  test('galeria desliza por toque e os pontos do carrossel acompanham', async ({ app, isMobile }) => {
    test.skip(!isMobile, 'Touch path.')
    const { page } = app
    await app.open(`/nft/${EMERALD.id}`)
    await page.getByRole('heading', { level: 1, name: EMERALD.name }).waitFor()

    await page.getByRole('button', { name: 'Ver foto 3 de 4' }).filter({ visible: true }).tap()
    await expect(page.getByText('Foto 3 de 4', { exact: true })).toBeAttached()

    const nav = page.getByRole('navigation', { name: 'Páginas de Mais desta coleção' })
    await nav.getByRole('button', { name: 'Ir para a página 2 de 6' }).tap()
    await expect(nav.getByRole('button', { name: 'Ir para a página 2 de 6' })).toHaveAttribute('aria-current', 'true')
  })

  test('compra por teclado também vale para quem usa a carteira secundária', async ({ app }) => {
    const { page } = app
    await readyToPay(app)
    await page.getByRole('radio', { name: /Reserva/ }).focus()
    await page.keyboard.press('Space')
    await expect(page.getByLabel('Tipo de carteira')).toHaveValue('Coinbase Wallet')
    await page.getByRole('button', { name: 'Conectar Reserva' }).focus()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Desconectar Reserva' }).waitFor()
    await buy(app)
    await expectReceipt(app)
  })
})
