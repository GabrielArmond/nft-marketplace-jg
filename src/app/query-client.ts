import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { reportSessionExpired } from '@/features/auth/session-expiry'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'

const STALE_TIME_MS = 30_000
const GC_TIME_MS = 5 * 60_000
const MAX_QUERY_RETRIES = 2
const MAX_RETRY_DELAY_MS = 8_000

/**
 * Retries only failures that can heal by themselves. Session, permission,
 * validation, not-found and conflict answers stay the same on a new attempt,
 * so retrying them would just delay the feedback.
 */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return failureCount < MAX_QUERY_RETRIES && normalizeApiError(error).isRetryable
}

/** A single place sees every 401, so no screen has to handle session loss on its own. */
function handleGlobalError(error: unknown): void {
  if (isApiError(error, 'unauthorized')) reportSessionExpired()
}

/**
 * Baseline policy; a query with stricter needs overrides it (a checkout quote
 * must be `staleTime: 0`).
 *
 * - staleTime 30s: avoids refetching on every navigation. Prices and stock
 *   change through events, not polling, and the quote is the source of truth
 *   at purchase time, so a short window is safe here.
 * - gcTime 5min: back/forward stays instant in the catalog without keeping
 *   abandoned filter combinations for the whole session.
 * - Focus and reconnect refetches keep the library defaults: they only hit
 *   stale queries and cover whatever happened while the tab was away.
 * - Mutations never retry automatically: repeating a non-idempotent write can
 *   duplicate it. Retries there must be explicit and use an idempotency key.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleGlobalError }),
  mutationCache: new MutationCache({ onError: handleGlobalError }),
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      retry: shouldRetryQuery,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, MAX_RETRY_DELAY_MS),
    },
    mutations: {
      retry: false,
    },
  },
})
