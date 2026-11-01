import { Button } from '@/components/ui/button'
import { normalizeApiError } from '@/lib/http/api-error'

interface AccountErrorProps {
  title: string
  error: unknown
  retrying: boolean
  onRetry: () => void
}

export function AccountError({ title, error, retrying, onRetry }: AccountErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-10">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-content-secondary">{normalizeApiError(error).message}</p>
      <Button size="lg" disabled={retrying} onClick={onRetry}>
        {retrying ? 'Tentando...' : 'Tentar novamente'}
      </Button>
    </div>
  )
}
