import { Link } from '@tanstack/react-router'

import { StatusScreen } from '@/components/feedback/status-screen'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <StatusScreen
      eyebrow="Erro 404"
      title="Página não encontrada"
      description="O endereço acessado não existe ou foi movido."
    >
      <Button asChild size="lg">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </StatusScreen>
  )
}
