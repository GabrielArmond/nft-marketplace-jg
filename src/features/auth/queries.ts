import { queryOptions, type QueryClient } from '@tanstack/react-query'

import { PRIVATE_SCOPE, queryKeys } from '@/app/query-keys'
import type { Session } from '@/contracts/auth'
import { API_ERROR_CODES } from '@/contracts/common'
import { getSession } from '@/features/auth/api'
import { reportSessionExpired } from '@/features/auth/session-expiry'
import { isApiError } from '@/lib/http/api-error'

const SESSION_STALE_TIME_MS = 10 * 60_000

/** `null` is a visitor. A 401 here means the session ended, which also leaves a visitor. */
export const sessionQueryOptions = queryOptions({
  queryKey: queryKeys.session,
  staleTime: SESSION_STALE_TIME_MS,
  queryFn: async ({ signal }): Promise<Session | null> => {
    try {
      return await getSession({ signal })
    } catch (error) {
      if (!isApiError(error, 'unauthorized')) throw error
      if (error.code === API_ERROR_CODES.sessionExpired) reportSessionExpired()
      return null
    }
  },
})

export function readCachedSession(queryClient: QueryClient): Session | null {
  return queryClient.getQueryData(queryKeys.session) ?? null
}

/** Applies a new identity and drops every trace of the previous one. */
export async function replaceSession(
  queryClient: QueryClient,
  session: Session | null,
): Promise<void> {
  queryClient.setQueryData(queryKeys.session, session)
  await queryClient.resetQueries({ queryKey: [PRIVATE_SCOPE] })
}

/** The session check runs first: it clears the lapsed cookie the guest cart depends on. */
export async function dropExpiredSession(queryClient: QueryClient): Promise<void> {
  queryClient.setQueryData(queryKeys.session, null)
  await queryClient.invalidateQueries({ queryKey: queryKeys.session })
  await queryClient.resetQueries({ queryKey: [PRIVATE_SCOPE] })
}
