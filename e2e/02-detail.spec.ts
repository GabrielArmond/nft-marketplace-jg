import { EMERALD, expect, test } from './support/fixtures.ts'

test.describe('fluxo 2: detalhe e recurso inexistente', () => {
  test('acesso direto mostra o NFT e sobrevive ao refresh', async ({ app }) => {
    const { page } = app
    await app.open(`/nft/${EMERALD.id}`)
    const title = page.getByRole('heading', { level: 1, name: EMERALD.name })

    await expect(title).toBeVisible()
    await expect(page.getByText('Nova Sato', { exact: true })).toBeVisible()
    await page.reload()
    await expect(title).toBeVisible()
    await app.expectNoHorizontalOverflow()
  })

  test('do catálogo ao detalhe, e de volta com os filtros', async ({ app }) => {
    const { page } = app
    await app.open('/?categories=%5B%22music%22%5D')
    const name = await app.cardNames().first().textContent()

    await app.cards().first().getByRole('link').first().click()
    await page.waitForURL(/\/nft\//)
    await expect(page.getByRole('heading', { level: 1, name: name ?? '' })).toBeVisible()

    await page.goBack()
    await expect(app.cards().first()).toBeVisible()
    expect(new URL(page.url()).searchParams.get('categories')).toContain('music')
  })

  test('edição esgotada não pode ser escolhida', async ({ app }) => {
    await app.open(`/nft/${EMERALD.id}`)
    await expect(app.page.getByRole('radio', { name: /^1\/1 / })).toBeDisabled()
  })

  test('NFT inexistente tem tela própria', async ({ app }) => {
    await app.open('/nft/nao-existe')
    await app.page.getByRole('heading', { name: 'NFT não encontrado' }).waitFor()
  })

  test('rota inexistente tem tela própria', async ({ app }) => {
    await app.open('/rota/inexistente')
    await expect(app.page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(app.page.getByRole('link', { name: /início/i }).filter({ visible: true }).first()).toBeVisible()
  })
})
