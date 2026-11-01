export interface AuthSearch {
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
    redirect: isSafeRedirect(search.redirect) ? search.redirect : undefined,
    reason: search.reason === 'expired' ? 'expired' : undefined,
  }
}
