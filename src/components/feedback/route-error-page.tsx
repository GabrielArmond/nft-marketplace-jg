import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'

import { StatusScreen } from '@/components/feedback/status-screen'
import { Button } from '@/components/ui/button'
import { normalizeApiError } from '@/lib/http/api-error'

export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  function retry() {
    reset()
    void router.invalidate()
  }

  return (
    <StatusScreen
      eyebrow="Erro"
      title="Não foi possível carregar a página"
      description={normalizeApiError(error).message}
    >
      <Button size="lg" onClick={retry}>
        Tentar novamente
      </Button>
    </StatusScreen>
  )
}
