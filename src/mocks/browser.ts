import { setupWorker } from 'msw/browser'

import { syncAcrossTabs } from '@/mocks/db/store'
import { applyUrlOverrides } from '@/mocks/engine/bootstrap'
import { startSettlementLoop } from '@/mocks/engine/engine'
import { exposeHarness } from '@/mocks/harness'
import { accountHandlers } from '@/mocks/handlers/account'
import { authHandlers } from '@/mocks/handlers/auth'
import { cartHandlers } from '@/mocks/handlers/cart'
import { catalogHandlers } from '@/mocks/handlers/catalog'
import { checkoutHandlers } from '@/mocks/handlers/checkout'
import { CONTROL_BASE_PATH, controlHandlers } from '@/mocks/handlers/control'
import { API_BASE_PATH } from '@/mocks/handlers/route'
import { createSocketHandler } from '@/mocks/realtime/socket-server'

/** Must finish before the first render: earlier requests would reach the real network. */
export async function enableMocks(): Promise<void> {
  applyUrlOverrides()
  syncAcrossTabs()

  const worker = setupWorker(
    ...controlHandlers,
    ...authHandlers,
    ...catalogHandlers,
    ...cartHandlers,
    ...checkoutHandlers,
    ...accountHandlers,
    createSocketHandler(),
  )

  await worker.start({
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest(request, print) {
      const { pathname } = new URL(request.url)
      // Assets pass through; an API route without a handler is a mistake worth showing.
      if (pathname.startsWith(`${API_BASE_PATH}/`) || pathname.startsWith(CONTROL_BASE_PATH)) {
        print.error()
      }
    },
  })

  startSettlementLoop()
  exposeHarness()
}
