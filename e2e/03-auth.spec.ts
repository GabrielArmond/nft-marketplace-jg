import { ANNA, expect, GABRIEL, test } from './support/fixtures.ts'

const FILTERED = '/?q=e&sort=price_desc'

test.describe('fluxo 3: cadastro, login, expiração, logout e troca de usuário', () => {
  test('cadastro com sucesso entra direto e sobrevive ao refresh', async ({ app }) => {
    const { page } = app
    await app.open('/cadastro')
    const dialog = page.getByRole('dialog')

    await dialog.getByLabel('Nome de usuário').fill('novo_user')
    await dialog.getByLabel('E-mail', { exact: true }).fill('novo@kurio.test')
    await dialog.getByLabel('Senha', { exact: true }).fill('senha-forte-1')
    await dialog.getByLabel('Confirmar senha').fill('outra-senha')
    await dialog.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible()

    await dialog.getByLabel('Confirmar senha').fill('senha-forte-1')
    await dialog.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await page.waitForURL((url) => url.pathname === '/')
    await expect(dialog).toBeHidden()

    const session = async () => {
      const { body } = await app.mock.rest<{ user: { username: string } | null }>('GET', '/auth/session')
      return body.user?.username
    }
    await expect.poll(session).toBe('novo_user')
    await page.reload()
    await expect.poll(session).toBe('novo_user')
  })

  test('cadastro mostra conflito no campo', async ({ app }) => {
    const { page } = app
    await app.open('/cadastro', { scenario: 'register-conflict' })
    const dialog = page.getByRole('dialog')

    await dialog.getByLabel('Nome de usuário').fill('outro_user')
    await dialog.getByLabel('E-mail', { exact: true }).fill(ANNA.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('senha-forte-1')
    await dialog.getByLabel('Confirmar senha').fill('senha-forte-1')
    await dialog.getByRole('button', { name: 'Criar conta', exact: true }).click()

    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(dialog.getByLabel('E-mail', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  })

  test('login no diálogo mantém página e filtros, inclusive com refresh e histórico', async ({
    app,
  }) => {
    const { page } = app
    await app.open(FILTERED)
    await expect(app.cards().first()).toBeVisible()
    const dialog = page.getByRole('dialog')
    const keepsFilters = () => {
      const { pathname, searchParams } = new URL(page.url())
      expect(pathname).toBe('/')
      expect(searchParams.get('q')).toBe('e')
      expect(searchParams.get('sort')).toBe('price_desc')
    }

    await app.loginTrigger().click()
    await expect(dialog).toBeVisible()
    keepsFilters()

    await page.reload()
    await expect(dialog).toBeVisible()
    keepsFilters()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    keepsFilters()

    await app.loginTrigger().click()
    await expect(dialog).toBeVisible()
    await page.goBack()
    await expect(dialog).toBeHidden()
    await page.goForward()
    await expect(dialog).toBeVisible()

    await app.fillLogin({ ...ANNA, password: 'senha-errada' })
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await app.fillLogin(ANNA)
    await expect(dialog).toBeHidden()
    await page.waitForURL((url) => !url.searchParams.has('auth'))
    keepsFilters()
    await app.expectSignedIn(ANNA)
  })

  test('rota privada leva ao login e volta ao destino', async ({ app }) => {
    const { page } = app
    await app.open('/perfil')
    await page.getByRole('dialog').waitFor()
    expect(new URL(page.url()).pathname).toBe('/login')

    await app.fillLogin(ANNA)
    await page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
    expect(new URL(page.url()).pathname).toBe('/perfil')
  })

  test('fechar o login de rota privada não prende o usuário no guard', async ({ app }) => {
    const { page } = app
    await app.open('/carteiras')
    await page.getByRole('dialog').waitFor()
    await page.keyboard.press('Escape')
    await page.waitForURL((url) => url.pathname === '/')
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('redirect externo é ignorado', async ({ app }) => {
    const { page } = app
    await app.open('/login?redirect=https://evil.example/')
    await page.getByRole('dialog').waitFor()
    await app.fillLogin(ANNA)
    await page.waitForURL((url) => url.pathname === '/')
    expect(page.url()).not.toContain('evil.example')
  })

  test('sessão expirada em rota privada volta ao login com aviso e retoma', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    await page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
    await page.getByLabel('Nome de exibição').fill('Anna Editada')
    await app.mock.expireSession()

    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'sessão expirou' })).toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/login')
    expect(page.url()).toContain('perfil')

    await app.fillLogin(ANNA)
    await page.waitForURL((url) => url.pathname === '/perfil')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Anna Editada')
  })

  test('sessão expirada em página pública abre o diálogo sem sair dela', async ({ app }) => {
    const { page } = app
    await app.signedIn(FILTERED)
    await expect(app.cards().first()).toBeVisible()
    await app.socketReady()
    await app.mock.expireSession()

    // Any private read now answers 401. A price event refetches the cart, which is one.
    await app.mock.updateEdition('emerald-ape-042', 'emerald-ape-042:1-50', { priceEth: '2' })

    await expect(page.getByRole('alert').filter({ hasText: 'sessão expirou' })).toBeVisible()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/')
    expect(new URL(page.url()).searchParams.get('q')).toBe('e')
  })

  test('logout limpa os dados e a troca de usuário não mistura carrinhos', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    await expect(app.cartLink(2)).toBeVisible()

    await page.getByRole('button', { name: 'Sair' }).click()
    await page.waitForURL((url) => url.pathname === '/')
    await expect(app.cartLink(0)).toBeVisible()
    await expect(page.getByText(ANNA.name)).toHaveCount(0)

    await app.loginTrigger().click()
    await app.fillLogin(GABRIEL)
    await app.expectSignedIn(GABRIEL)
    await expect(app.cartLink(0)).toBeVisible()
  })

  test('itens de visitante entram no carrinho ao fazer login', async ({ app }) => {
    const { page } = app
    await app.open('/')
    await app.mock.addToCart('ivory-baron-088', 'ivory-baron-088:open', 1)
    await page.reload()
    await expect(app.cartLink(1)).toBeVisible()

    await app.loginTrigger().click()
    await app.fillLogin(ANNA)
    await expect(app.cartLink(3)).toBeVisible()
  })
})
