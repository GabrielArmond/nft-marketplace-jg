export type AuthMode = 'login' | 'register'

/**
 * Search params of the root route, available on every URL. `auth` opens the dialog
 * over the current page: being in the URL, it survives a refresh and follows the
 * browser history. `redirect` is where to go after authenticating.
 */
export interface AuthSearch {
  auth?: AuthMode | undefined
  redirect?: string | undefined
  reason?: 'expired' | undefined
}

const AUTH_SCREEN = /^\/(login|cadastro)([/?#]|$)/

/**
 * Only same-origin paths: `redirect` comes from the URL and could point anywhere.
 * Auth screens are refused too: returning to one would chain redirects forever.
 */
function isSafeRedirect(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !/^\/[/\\]/.test(value) &&
    !AUTH_SCREEN.test(value)
  )
}

/**
 * Keys are always returned, even when empty: the router merges this result over
 * the raw query string, so omitting a rejected value would let it through.
 */
export function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
  return {
    auth: search.auth === 'login' || search.auth === 'register' ? search.auth : undefined,
    redirect: isSafeRedirect(search.redirect) ? search.redirect : undefined,
    reason: search.reason === 'expired' ? 'expired' : undefined,
  }
}

/** Marks history entries created by opening the dialog: closing it can simply go back. */
export const AUTH_MODAL_STATE = { authModal: true }

/** Link or navigation options that open the dialog without leaving the current page. */
export function authModalTarget(mode: AuthMode, redirect?: string, reason?: 'expired') {
  return {
    to: '.',
    search: (previous: Record<string, unknown>) => ({ ...previous, auth: mode, redirect, reason }),
    state: AUTH_MODAL_STATE,
    resetScroll: false,
  } as const
}
