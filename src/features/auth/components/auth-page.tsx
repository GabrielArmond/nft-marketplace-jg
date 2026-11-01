import { useNavigate, useRouter } from '@tanstack/react-router'

import { AuthDialog } from '@/features/auth/components/auth-dialog'
import type { AuthMode, AuthSearch } from '@/features/auth/redirect'
import { HomePage } from '@/features/catalog/pages/home-page'

/** `/login` and `/cadastro`: direct access, and the return path of protected routes. */
export function AuthPage({ mode, search }: { mode: AuthMode; search: AuthSearch }) {
  const router = useRouter()
  const navigate = useNavigate()

  return (
    <>
      <HomePage />
      <AuthDialog
        mode={mode}
        expired={search.reason === 'expired'}
        // Never to `redirect`: it may be a private route, whose guard would bring the user back.
        onClose={() => {
          void navigate({ to: '/' })
        }}
        onDone={() => {
          router.history.replace(search.redirect ?? '/')
        }}
        onSwitch={(next) => {
          void navigate({ to: next === 'login' ? '/login' : '/cadastro', search })
        }}
      />
    </>
  )
}
