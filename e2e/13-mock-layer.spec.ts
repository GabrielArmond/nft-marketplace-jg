import { EMERALD, expect, GABRIEL, test } from './support/fixtures.ts'

/** The simulated server's own rules: they back every flow, so they get a direct check. */
test.describe('camada de mocks', () => {
  test.skip(({ isMobile }) => isMobile, 'The API does not depend on the viewport.')

  test('reset restaura integralmente um estado conhecido', async ({ app }) => {
    await app.open('/')
    await app.mock.login(GABRIEL)
    await app.mock.addToCart(EMERALD.id, EMERALD.edition, 1)
    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { priceEth: '9.99' })

    await app.open('/')
    const { body } = await app.mock.rest<{ user: unknown }>('GET', '/auth/session')
    expect(body.user).toBeNull()
    await expect(app.cards().first()).toContainText('1.19 ETH')
  })

  test('pedido sem chave de idempotência é recusado', async ({ app }) => {
    await app.open('/')
    await app.mock.login(GABRIEL)

    const { status, body } = await app.mock.rest<{ error: { code: string } }>('POST', '/orders', {
      quoteId: 'quo_x',
      walletId: 'wal_gabriel_primary',
      network: 'ethereum',
      collector: { displayName: 'G', username: 'g', email: GABRIEL.email },
    })
    expect(status).toBe(400)
    expect(body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED')
  })

  test('recurso privado responde 401 a visitante, com envelope de erro', async ({ app }) => {
    await app.open('/')
    const { status, body } = await app.mock.rest<{ error: { code: string; message: string } }>(
      'GET',
      '/orders',
    )
    expect(status).toBe(401)
    expect(body.error.code).toBeTruthy()
    expect(body.error.message).toBeTruthy()
  })

  test('todo cenário anunciado pode ser ativado', async ({ app }) => {
    await app.open('/')
    const { scenarios } = await app.mock.state()
    expect(scenarios.length).toBeGreaterThanOrEqual(20)

    for (const { id } of scenarios) await app.mock.setScenario(id)
    await app.mock.setScenario('instant')
  })

  test('mudança do catálogo vale para REST e evento ao mesmo tempo', async ({ app }) => {
    await app.open('/')
    await app.socketReady()
    await app.mock.updateEdition(EMERALD.id, EMERALD.edition, { priceEth: '5.55' })

    const { body } = await app.mock.rest<{ editions: { id: string; priceEth: string }[] }>(
      'GET',
      `/nfts/${EMERALD.id}`,
    )
    expect(body.editions.find(({ id }) => id === EMERALD.edition)?.priceEth).toBe('5.55')

    const { events } = await app.mock.state()
    expect(events.some(({ type, resource }) => type === 'nft.updated' && resource.id === EMERALD.id)).toBe(true)
  })
})
