import * as account from '@/features/account/api'
import * as auth from '@/features/auth/api'
import * as cart from '@/features/cart/api'
import * as catalog from '@/features/catalog/api'
import * as checkout from '@/features/checkout/api'
import * as favorites from '@/features/favorites/api'
import { normalizeApiError } from '@/lib/http/api-error'
import * as eth from '@/lib/money/eth'
import * as realtime from '@/lib/realtime/socket-client'

declare global {
  interface Window {
    __kurio?: typeof harness
  }
}

/**
 * Verification entry point while no screen consumes the API layer. Exposes the
 * real REST and socket clients, so a script exercises Axios and socket.io-client
 * exactly as the UI will. Mock builds only; remove it once the flows are covered
 * by Playwright through the UI.
 */
const harness = {
  api: { account, auth, cart, catalog, checkout, favorites },
  eth,
  normalizeApiError,
  realtime,
}

export function exposeHarness(): void {
  window.__kurio = harness
}
