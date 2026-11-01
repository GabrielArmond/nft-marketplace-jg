import { useNavigate, useRouter, useRouterState, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { useSession } from '@/features/auth/hooks'
import { AUTH_MODAL_STATE, type AuthMode } from '@/features/auth/redirect'

function withoutAuth(previous: Record<string, unknown>) {
  return { ...previous, auth: undefined, redirect: undefined, reason: undefined }
}

/** The dialog over the current page. Default export: loaded only when it opens. */
export default function AuthModal({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const navigate = useNavigate()
  const { redirect, reason } = useSearch({ strict: false })
  const { data: session } = useSession()
  const openedInApp = useRouterState({
    select: ({ location }) => location.state.authModal === true,
  })

  function close() {
    // Undoing the entry keeps Back and Forward free of a duplicate of this page.
    if (openedInApp) {
      router.history.back()
      return
    }
    void navigate({ to: '.', search: withoutAuth, replace: true, resetScroll: false })
  }

  function onDone() {
    if (redirect) router.history.replace(redirect)
    else close()
  }

  // A refresh can land here already signed in: there is nothing left to ask.
  const signedIn = Boolean(session)
  useEffect(() => {
    if (signedIn) {
      void navigate({ to: '.', search: withoutAuth, replace: true, resetScroll: false })
    }
  }, [signedIn, navigate])

  if (signedIn) return null

  return (
    <AuthDialog
      mode={mode}
      expired={reason === 'expired'}
      onClose={close}
      onDone={onDone}
      onSwitch={(next) => {
        void navigate({
          to: '.',
          search: (previous: Record<string, unknown>) => ({ ...previous, auth: next }),
          replace: true,
          resetScroll: false,
          state: openedInApp ? AUTH_MODAL_STATE : undefined,
        })
      }}
    />
  )
}
