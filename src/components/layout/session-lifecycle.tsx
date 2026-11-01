import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useSession } from '@/features/auth/hooks'
import { dropExpiredSession, readCachedSession } from '@/features/auth/queries'
import { authModalTarget } from '@/features/auth/redirect'
import { onSessionExpired } from '@/features/auth/session-expiry'
import { startNftRealtimeSync } from '@/features/catalog/nft-realtime-sync'
import { startOrderRealtimeSync } from '@/features/checkout/order-realtime-sync'
import { disconnectRealtime, restartRealtime } from '@/lib/realtime/socket-client'

/** App-wide reactions to the session. Renders nothing. */
export function SessionLifecycle() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const userId = session?.user.id ?? null

  useEffect(
    () =>
      onSessionExpired(() => {
        // Visitors also get 401s; only an active session has context worth preserving.
        if (!readCachedSession(queryClient)) return

        const { location, matches } = router.state
        const onPrivateRoute = matches.some(({ routeId }) => routeId.startsWith('/_private'))

        void dropExpiredSession(queryClient)
        // A private page cannot stay on screen; anything else stays under the dialog.
        void router.navigate(
          onPrivateRoute
            ? { to: '/login', search: { redirect: location.href, reason: 'expired' } }
            : authModalTarget('login', undefined, 'expired'),
        )
      }),
    [queryClient, router],
  )

  useEffect(() => startNftRealtimeSync(queryClient), [queryClient])
  useEffect(() => startOrderRealtimeSync(queryClient), [queryClient])

  // The server binds the socket to the session at handshake: a new user needs a new one.
  useEffect(() => {
    if (isPending) return undefined

    restartRealtime()
    return disconnectRealtime
  }, [isPending, userId])

  return null
}
