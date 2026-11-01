import { useNavigate } from '@tanstack/react-router'

import { StatusScreen } from '@/components/feedback/status-screen'
import { Button } from '@/components/ui/button'
import { useLogout, useSession } from '@/features/auth/hooks'
import { normalizeApiError } from '@/lib/http/api-error'

/** Provisional: holds the logout action until the real profile screen arrives. */
export function ProfilePage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const logout = useLogout()

  function onLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        void navigate({ to: '/' })
      },
    })
  }

  return (
    <StatusScreen
      eyebrow="Em construção"
      title="Perfil do colecionador"
      description={session?.user.email ?? ''}
    >
      <div className="flex flex-col items-center gap-3">
        <Button size="lg" disabled={logout.isPending} onClick={onLogout}>
          {logout.isPending ? 'Saindo...' : 'Sair'}
        </Button>
        {logout.isError && (
          <p role="alert" className="text-xs text-destructive">
            {normalizeApiError(logout.error).message}
          </p>
        )}
      </div>
    </StatusScreen>
  )
}
