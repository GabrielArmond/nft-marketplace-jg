import { Link } from '@tanstack/react-router'

import { StatusScreen } from '@/components/feedback/status-screen'
import { Button } from '@/components/ui/button'

/** Keeps shell links honest until each screen lands: it never pretends to work. */
export function UnderConstruction({ title }: { title: string }) {
  return (
    <StatusScreen
      eyebrow="Em construção"
      title={title}
      description="Esta tela ainda não está disponível."
    >
      <Button asChild size="lg">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </StatusScreen>
  )
}
