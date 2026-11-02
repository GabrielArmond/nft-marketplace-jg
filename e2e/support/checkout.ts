import type { Locator } from '@playwright/test'

import { ANNA, EMERALD, expect, GOLDEN, type Account, type App, type OpenOptions } from './fixtures.ts'

export const RECEIPT_HEADING = 'Seus NFTs agora estão na sua carteira'

export function confirmButton(app: App): Locator {
  return app.page.getByRole('button', { name: /^(Confirmar compra|Verificando valores)/ })
}

/** On `/pagamento`, with the quote loaded and the primary wallet connected. */
export async function readyToPay(
  app: App,
  options: OpenOptions & {
    account?: Account
    items?: { id: string; edition: string; quantity: number }[]
  } = {},
): Promise<void> {
  const {
    account = ANNA,
    items = [
      { id: EMERALD.id, edition: EMERALD.edition, quantity: 1 },
      { id: GOLDEN.id, edition: GOLDEN.edition, quantity: 1 },
    ],
    ...open
  } = options

  await app.signedIn('/pagamento', account, { ...open, items })
  await app.page.getByRole('heading', { name: 'Perfil do colecionador' }).waitFor()
  await app.page.getByRole('button', { name: /^Conectar / }).first().click()
  await app.page.getByRole('button', { name: /^Desconectar / }).first().waitFor()
  await expect(confirmButton(app)).toBeEnabled()
}

export async function openReview(app: App): Promise<void> {
  await confirmButton(app).click()
  await app.page.getByRole('dialog', { name: 'Revise sua compra' }).waitFor()
}

export async function pay(app: App): Promise<void> {
  await app.page.getByRole('button', { name: 'Confirmar pagamento' }).click()
}

export async function onOrderPage(app: App): Promise<string> {
  await app.page.waitForURL((url) => url.pathname.startsWith('/pedido/'))
  return new URL(app.page.url()).pathname.split('/').at(-1) ?? ''
}

export async function expectReceipt(app: App, timeout = 15_000): Promise<void> {
  await expect(app.page.getByRole('heading', { name: RECEIPT_HEADING })).toBeVisible({ timeout })
}

export async function buy(app: App): Promise<string> {
  await openReview(app)
  await pay(app)
  return onOrderPage(app)
}
