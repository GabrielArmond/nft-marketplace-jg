import { confirmButton } from './support/checkout.ts'
import { ANNA, expect, GABRIEL, test, type App } from './support/fixtures.ts'

const NEW_ADDRESS = `0x${'1'.repeat(40)}`
const OTHER_ADDRESS = `0x${'2'.repeat(40)}`

function save(app: App) {
  return app.page.getByRole('button', { name: /^(Salvar|Salvando)/ })
}

function saved(app: App) {
  return app.page.getByRole('status').filter({ hasText: 'Alterações salvas.' })
}

async function pngFile(app: App) {
  const data = await app.page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    canvas.getContext('2d')?.fillRect(0, 0, 64, 64)
    return canvas.toDataURL('image/png').split(',')[1] ?? ''
  })
  return { name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') }
}

function browserStorage(app: App): Promise<string> {
  return app.page.evaluate(() =>
    JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]),
  )
}

test.describe('fluxo 8: perfil', () => {
  test('edição persiste, reflete no cabeçalho e bloqueia envio limpo', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    const name = page.getByLabel('Nome de exibição')
    await expect(name).toHaveValue(ANNA.name)
    await expect(save(app)).toBeDisabled()

    await name.fill('Anna Nova')
    await expect(page.getByRole('status').filter({ hasText: 'Há alterações não salvas.' })).toBeVisible()
    await page.getByLabel('Nome de usuário').fill('anna_nova')
    await page.getByLabel('Nome ENS').fill('annanova')
    await page.getByLabel('Apelido da carteira').fill('Cofre')
    await save(app).click()

    await expect(saved(app)).toBeVisible()
    await expect(save(app)).toBeDisabled()
    await app.expectSignedIn({ ...ANNA, name: 'Anna Nova' })

    await page.reload()
    await expect(name).toHaveValue('Anna Nova')
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('anna_nova')
    await expect(page.getByLabel('Apelido da carteira')).toHaveValue('Cofre')
    await app.expectNoHorizontalOverflow()
  })

  test('validação e erros da API ficam nos campos', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    const name = page.getByLabel('Nome de exibição')

    await name.fill('')
    await page.getByLabel('Nome de usuário').fill('Inválido!')
    await save(app).click()
    await expect(page.getByText('O nome precisa de ao menos 2 caracteres.')).toBeVisible()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(name).toBeFocused()
    await expect(page.getByText(/Use de 3 a 24 letras/)).toBeVisible()

    await name.fill(ANNA.name)
    await page.getByLabel('Nome de usuário').fill('gabriel_mint')
    await save(app).click()
    await expect(page.getByText('Este nome de usuário já existe.')).toBeVisible()
    await expect(page.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')
  })

  test('profile-validation-error aparece no campo', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil', ANNA, { scenario: 'profile-validation-error' })
    await page.getByLabel('Nome de usuário').fill('anna_outro')
    await save(app).click()
    await expect(page.getByText('Este nome de usuário não é permitido.')).toBeVisible()
  })

  test('cliques repetidos enviam uma vez', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil', ANNA, { scenario: 'instant', latency: 300 })
    const writes: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'PATCH' && request.url().includes('/api/profile')) writes.push(request.url())
    })

    await page.getByLabel('Nome de exibição').fill('Anna Rápida')
    await save(app).dblclick()
    await expect(page.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    await expect(saved(app)).toBeVisible()
    expect(writes).toHaveLength(1)
  })

  test('avatar: incluir, trocar, recusar arquivo e remover', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil', GABRIEL)
    await expect(page.getByRole('button', { name: 'Remover avatar' })).toBeDisabled()
    const file = page.locator('input[type=file]')
    const png = await pngFile(app)

    await file.setInputFiles(png)
    await expect(page.getByRole('status').filter({ hasText: 'Avatar atualizado.' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Avatar atual' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('img', { name: 'Avatar atual' })).toBeVisible()

    await file.setInputFiles(png)
    await expect(page.getByRole('button', { name: 'Alterar avatar' })).toBeVisible()

    await file.setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') })
    await expect(page.getByRole('alert').filter({ hasText: 'Use uma imagem PNG, JPEG ou WebP.' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover avatar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Avatar removido.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Incluir avatar' })).toBeFocused()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Incluir avatar' })).toBeVisible()
  })

  test('senha errada fica no campo, a certa troca e o login usa a nova', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    const current = page.getByLabel('Senha atual', { exact: true })
    const next = page.getByLabel('Nova senha', { exact: true })
    const confirmation = page.getByLabel('Confirmar nova senha', { exact: true })

    await current.fill('errada-123')
    await next.fill('curta')
    await confirmation.fill('outra')
    await save(app).click()
    await expect(page.getByText('A senha precisa de ao menos 8 caracteres.')).toBeVisible()
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible()

    await next.fill('NovaSenha#1')
    await confirmation.fill('NovaSenha#1')
    await save(app).click()
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()
    await expect(current).toHaveAttribute('aria-invalid', 'true')

    await current.fill(ANNA.password)
    await save(app).click()
    await expect(saved(app)).toBeVisible()
    await expect(current).toHaveValue('')

    const storage = await browserStorage(app)
    expect(storage).not.toContain('NovaSenha')
    expect(storage).not.toContain(ANNA.password)

    await page.getByRole('button', { name: 'Sair' }).click()
    await page.waitForURL((url) => url.pathname === '/')
    await app.goto('/login')
    await app.fillLogin(ANNA)
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await app.fillLogin({ ...ANNA, password: 'NovaSenha#1' })
    await app.expectSignedIn(ANNA)
  })

  test('perfil salvo continua salvo se a senha falhar', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    await page.getByLabel('Nome de exibição').fill('Anna Parcial')
    await page.getByLabel('Senha atual', { exact: true }).fill('errada-123')
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha#1')
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha#1')
    await save(app).click()

    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()
    await app.expectSignedIn({ ...ANNA, name: 'Anna Parcial' })
    await expect(save(app)).toBeEnabled()
  })

  test('senha nunca volta do rascunho depois de a sessão expirar', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    await page.getByLabel('Nome de exibição').fill('Anna Interrompida')
    await page.getByLabel('Senha atual', { exact: true }).fill(ANNA.password)
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha#1')
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha#1')
    await app.mock.expireSession()
    await save(app).click()

    await expect(page.getByRole('alert').filter({ hasText: 'sessão expirou' })).toBeVisible()
    await app.fillLogin(ANNA)
    await page.waitForURL((url) => url.pathname === '/perfil')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Anna Interrompida')
    await expect(page.getByLabel('Senha atual', { exact: true })).toHaveValue('')
  })

  test('itens fora do escopo avisam, sem aparentar sucesso', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    await page.getByRole('button', { name: 'Atividade' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Atividade não está disponível.' })).toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/perfil')
  })
})

test.describe('fluxo 8: carteiras', () => {
  test('cadastro com validação, erro da API, edição e conexão', async ({ app }) => {
    const { page } = app
    await app.signedIn('/carteiras', GABRIEL)
    await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()

    await page.getByRole('button', { name: 'Adicionar carteira secundária' }).click()
    const form = page.getByRole('form', { name: 'Dados da carteira secundária' })
    await form.getByLabel('Apelido da carteira').fill('Reserva')
    await form.getByLabel('Endereço da carteira').fill('0x123')
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(form.getByText('Use um endereço 0x com 40 caracteres hexadecimais.')).toBeVisible()
    await expect(form.getByText('Selecione uma rede.')).toBeVisible()

    await form.getByLabel('Igual à carteira principal').check()
    await expect(form.getByLabel('Rede')).toHaveValue('ethereum')
    await form.getByLabel('Rede').selectOption('polygon')
    await form.getByLabel('Endereço da carteira').fill('0xB2C300000000000000000000000000000000D4F1')
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(form.getByText('Este endereço já está em outra carteira sua.')).toBeVisible()

    await form.getByLabel('Endereço da carteira').fill(NEW_ADDRESS)
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Carteira secundária salva.' })).toBeVisible()
    await page.reload()
    await expect(page.getByText(NEW_ADDRESS)).toBeVisible()

    await page.getByRole('button', { name: 'Conectar Reserva' }).click()
    await page.getByRole('button', { name: 'Desconectar Reserva' }).waitFor()

    await page.getByRole('button', { name: 'Editar carteira secundária' }).click()
    await form.getByLabel('Apelido da carteira').fill('Reserva 2')
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByRole('button', { name: 'Desconectar Reserva 2' })).toBeVisible()

    await page.getByRole('button', { name: 'Editar carteira secundária' }).click()
    await form.getByLabel('Endereço da carteira').fill(OTHER_ADDRESS)
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByRole('button', { name: 'Conectar Reserva 2' }), 'new address').toBeVisible()
    await app.expectNoHorizontalOverflow()
  })

  test('definir principal reflete no pagamento sem recarregar', async ({ app }) => {
    const { page } = app
    await app.signedIn('/carteiras', ANNA)
    await page.getByRole('button', { name: 'Conectar Reserva' }).click()
    await page.getByRole('button', { name: 'Desconectar Reserva' }).waitFor()

    await page.getByRole('button', { name: 'Definir como principal' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Reserva agora é a carteira principal.' })).toBeVisible()
    const wallets = await app.mock.wallets()
    expect(wallets.filter(({ role }) => role === 'primary').map(({ label }) => label)).toEqual(['Reserva'])

    await app.cartLink(2).click()
    await page.getByRole('link', { name: 'Finalizar', exact: true }).click()
    await page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
    await expect(page.getByLabel('Rede')).toHaveValue('polygon')
    await expect(page.getByLabel('Tipo de carteira')).toHaveValue('Coinbase Wallet')
    await expect(confirmButton(app)).toBeEnabled()
  })

  test('conta nova: vazio, principal primeiro, depois secundária', async ({ app }) => {
    const { page } = app
    await app.open('/')
    await app.mock.rest('POST', '/auth/register', {
      displayName: 'Nova',
      username: 'nova_user',
      email: 'nova@kurio.test',
      password: 'senha-forte-1',
    })
    await app.goto('/carteiras')
    await expect(page.getByText('Você ainda não adicionou uma carteira principal.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Adicionar carteira secundária' })).toBeDisabled()

    await page.getByRole('button', { name: 'Adicionar carteira principal' }).click()
    const form = page.getByRole('form', { name: 'Dados da carteira principal' })
    await form.getByLabel('Apelido da carteira').fill('Primeira')
    await form.getByLabel('Rede').selectOption('ethereum')
    await form.getByLabel('Tipo de carteira').selectOption('metamask')
    await form.getByLabel('Endereço da carteira').fill(NEW_ADDRESS)
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Carteira principal salva.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Adicionar carteira secundária' })).toBeEnabled()
  })

  test('dados isolados e rascunho limpo no logout', async ({ app }) => {
    const { page } = app
    await app.signedIn('/perfil')
    await page.getByLabel('Nome de exibição').fill('Rascunho da Anna')
    await expect(page.getByRole('status').filter({ hasText: 'Há alterações não salvas.' })).toBeVisible()
    await expect.poll(() => browserStorage(app)).toContain('Rascunho da Anna')

    await page.getByRole('button', { name: 'Sair' }).click()
    await page.waitForURL((url) => url.pathname === '/')
    expect(await browserStorage(app)).not.toContain('Rascunho da Anna')

    await app.goto('/carteiras')
    await app.fillLogin(GABRIEL)
    await page.waitForURL((url) => url.pathname === '/carteiras')
    await expect(page.getByText('Carteira do Gabriel').first()).toBeVisible()
    await expect(page.getByText('Reserva')).toHaveCount(0)
  })

  test('rascunho de carteira volta depois de a sessão expirar', async ({ app }) => {
    const { page } = app
    await app.signedIn('/carteiras', GABRIEL)
    await page.getByRole('button', { name: 'Adicionar carteira secundária' }).click()
    await page.getByLabel('Apelido da carteira').fill('Quase salva')
    await page.getByLabel('Rede').selectOption('polygon')
    await page.getByLabel('Tipo de carteira').selectOption('coinbase')
    await page.getByLabel('Endereço da carteira').fill(NEW_ADDRESS)
    await app.mock.expireSession()
    await page.getByRole('button', { name: 'Salvar carteira' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'sessão expirou' })).toBeVisible()
    await app.fillLogin(GABRIEL)
    await page.waitForURL((url) => url.pathname === '/carteiras')
    await page.getByRole('button', { name: 'Adicionar carteira secundária' }).click()
    await expect(page.getByLabel('Apelido da carteira')).toHaveValue('Quase salva')
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(NEW_ADDRESS)
  })
})
