import { ANNA, EMERALD, expect, GABRIEL, test, type App } from './support/fixtures.ts'

const SAGE = 'Sage Nomad #009'
const SAGE_ID = 'sage-nomad-009'

function heart(app: App, name: string) {
  return app.page.getByRole('button', { name: `Favoritar ${name}` }).filter({ visible: true }).first()
}

function detailButton(app: App) {
  return app.page.getByRole('button', { name: /^Favorita/ }).filter({ visible: true }).first()
}

test.describe('fluxo 4: favoritos', () => {
  test('favoritar pelo card persiste e aparece na lista', async ({ app }) => {
    const { page } = app
    await app.signedIn('/')
    await expect(heart(app, EMERALD.name)).toHaveAttribute('aria-pressed', 'true')

    await heart(app, SAGE).click()
    await expect(page.getByText(`${SAGE} adicionado aos favoritos.`)).toBeVisible()
    await page.reload()
    await expect(heart(app, SAGE)).toHaveAttribute('aria-pressed', 'true')

    await app.goto('/favoritos')
    await expect(page.locator('main article h3').filter({ hasText: SAGE })).toBeVisible()

    await heart(app, SAGE).click()
    await expect(page.locator('main article h3').filter({ hasText: SAGE })).toHaveCount(0)
    await expect.poll(() => app.mock.favoriteIds()).not.toContain(SAGE_ID)
  })

  test('falha na mutation desfaz o estado, avisa e permite recuperar', async ({ app }) => {
    const { page } = app
    await app.signedIn(`/nft/${SAGE_ID}`, ANNA)
    await expect(detailButton(app)).toHaveAttribute('aria-pressed', 'false')

    await app.mock.setScenario('instant', 400)
    await app.mock.addFault({
      id: 'favorite',
      method: 'PUT',
      path: '^/favorites/',
      phase: 'before',
      times: 1,
      action: { kind: 'http', status: 500, code: 'SERVICE_UNAVAILABLE', message: 'Falha.' },
    })

    await detailButton(app).click()
    await expect(detailButton(app), 'optimistic').toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText(`Não foi possível atualizar os favoritos de ${SAGE}.`)).toBeVisible()
    await expect(detailButton(app), 'rolled back').toHaveAttribute('aria-pressed', 'false')
    expect(await app.mock.favoriteIds()).not.toContain(SAGE_ID)

    await detailButton(app).click()
    await expect(page.getByText(`${SAGE} adicionado aos favoritos.`)).toBeVisible()
    await expect.poll(() => app.mock.favoriteIds()).toContain(SAGE_ID)
  })

  test('visitante é convidado a entrar e continua na página', async ({ app }) => {
    const { page } = app
    await app.open(`/nft/${EMERALD.id}`)
    await expect(detailButton(app)).toBeVisible()

    await detailButton(app).click()
    await page.getByRole('dialog').waitFor()
    expect(new URL(page.url()).pathname).toBe(`/nft/${EMERALD.id}`)

    await app.fillLogin(GABRIEL)
    await expect(page.getByRole('dialog')).toBeHidden()
    expect(new URL(page.url()).pathname).toBe(`/nft/${EMERALD.id}`)
    await detailButton(app).click()
    await expect(page.getByText(`${EMERALD.name} adicionado aos favoritos.`)).toBeVisible()
  })

  test('favoritos são isolados por usuário', async ({ app }) => {
    const { page } = app
    await app.signedIn('/favoritos', GABRIEL)
    await page.getByRole('heading', { name: 'Lista de interesse' }).waitFor()
    await expect(page.locator('main article h3')).toHaveText(['Golden Beat #207'])
    expect(await app.mock.favoriteIds()).not.toContain(EMERALD.id)
  })
})
