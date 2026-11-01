import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { StatusScreen } from '@/components/feedback/status-screen'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { nftDetailQueryOptions } from '@/features/catalog/queries'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'
import { formatEth } from '@/lib/money/eth'

function BackToCatalog() {
  return (
    <Button asChild size="lg">
      <Link to="/">Voltar ao catálogo</Link>
    </Button>
  )
}

/** Provisional: proves navigation and direct access until the real detail screen arrives. */
export function NftPlaceholderPage({ id }: { id: string }) {
  const { data, error, isPending, refetch } = useQuery(nftDetailQueryOptions(id))

  if (isPending) {
    return (
      <div aria-busy="true" className="page-container flex flex-col gap-4 py-12">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    )
  }

  if (isApiError(error, 'not_found')) {
    return (
      <StatusScreen
        eyebrow="Erro 404"
        title="NFT não encontrado"
        description="Este NFT não existe ou foi removido do catálogo."
      >
        <BackToCatalog />
      </StatusScreen>
    )
  }

  if (!data) {
    return (
      <StatusScreen
        eyebrow="Erro"
        title="Não foi possível carregar o NFT"
        description={normalizeApiError(error).message}
      >
        <Button
          size="lg"
          onClick={() => {
            void refetch()
          }}
        >
          Tentar novamente
        </Button>
      </StatusScreen>
    )
  }

  return (
    <StatusScreen
      eyebrow="Em construção"
      title={data.name}
      description={`${formatEth(data.priceEth)} ETH`}
    >
      <BackToCatalog />
    </StatusScreen>
  )
}
