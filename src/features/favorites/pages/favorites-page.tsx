import { Link } from '@tanstack/react-router'

import { StatusScreen } from '@/components/feedback/status-screen'
import { Button } from '@/components/ui/button'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { useFavorites } from '@/features/favorites/hooks'
import { normalizeApiError } from '@/lib/http/api-error'

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-8 md:gap-y-16 xl:grid-cols-4'
const SKELETON_CARDS = ['a', 'b', 'c', 'd']

export function FavoritesPage() {
  const { data, error, isPending, isFetching, refetch } = useFavorites()

  if (error && !data) {
    return (
      <StatusScreen
        eyebrow="Erro"
        title="Não foi possível carregar os favoritos"
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

  if (data?.items.length === 0) {
    return (
      <StatusScreen
        eyebrow="Lista de interesse"
        title="Nenhum favorito ainda"
        description="Toque no coração de um NFT para guardá-lo aqui."
      >
        <Button asChild size="lg">
          <Link to="/" hash="catalogo">
            Explorar o catálogo
          </Link>
        </Button>
      </StatusScreen>
    )
  }

  return (
    <div className="page-container py-10 md:py-12">
      <h1 className="mb-8 text-2xl font-bold md:text-3xl">Lista de interesse</h1>
      <p role="status" className="sr-only">
        {isPending ? 'Carregando favoritos.' : `${data.items.length.toString()} favoritos.`}
      </p>
      <div aria-busy={isPending} className={GRID}>
        {data
          ? data.items.map((nft) => <NftCard key={nft.id} nft={nft} />)
          : SKELETON_CARDS.map((card) => <NftCardSkeleton key={card} />)}
      </div>
    </div>
  )
}
