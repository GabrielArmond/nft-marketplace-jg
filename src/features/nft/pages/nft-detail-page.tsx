import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { StatusScreen } from '@/components/feedback/status-screen'
import { Button } from '@/components/ui/button'
import { nftDetailQueryOptions } from '@/features/catalog/queries'
import { NftDetailSkeleton } from '@/features/nft/components/nft-detail-skeleton'
import { NftGallery } from '@/features/nft/components/nft-gallery'
import { NftInfoTabs } from '@/features/nft/components/nft-info-tabs'
import { NftPurchasePanel } from '@/features/nft/components/nft-purchase-panel'
import { NftRelated } from '@/features/nft/components/nft-related'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'

function BackToCatalog() {
  return (
    <Button asChild size="lg">
      <Link to="/">Voltar ao catálogo</Link>
    </Button>
  )
}

export function NftDetailPage({ id }: { id: string }) {
  const { data, error, isPending, isFetching, refetch } = useQuery(nftDetailQueryOptions(id))

  if (isPending) return <NftDetailSkeleton />

  if (!data && isApiError(error, 'not_found')) {
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
          disabled={isFetching}
          onClick={() => {
            void refetch()
          }}
        >
          {isFetching ? 'Tentando...' : 'Tentar novamente'}
        </Button>
      </StatusScreen>
    )
  }

  return (
    <div className="md:page-container md:pt-8">
      <nav aria-label="Trilha" className="mb-3 hidden text-md leading-4 font-bold md:block">
        <Link to="/">Início</Link>
        {' / '}
        <Link to="/" hash="catalogo">
          Mercado
        </Link>
      </nav>

      {/* A failed refresh keeps the screen: the data shown is still the latest known. */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 px-6 pt-4 text-sm md:mb-4 md:px-0 md:pt-0"
        >
          <span>Não foi possível atualizar este NFT.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch()
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <div className="md:grid md:gap-8 xl:grid-cols-[35.8125rem_minmax(0,1fr)]">
        <NftGallery nft={data} />
        {/* Keyed: moving to another NFT starts a new selection. */}
        <NftPurchasePanel key={data.id} nft={data} />
      </div>

      <div className="mt-8 md:mt-20">
        <NftInfoTabs nft={data} />
      </div>
      <NftRelated excludeIds={[data.id]} />
    </div>
  )
}
