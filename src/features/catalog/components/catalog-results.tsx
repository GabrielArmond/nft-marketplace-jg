import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { NftList } from '@/contracts/nfts'
import { CatalogPagination } from '@/features/catalog/components/catalog-pagination'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { countActiveFilters, type CatalogSearch } from '@/features/catalog/search-params'
import { normalizeApiError } from '@/lib/http/api-error'
import { formatEth } from '@/lib/money/eth'
import { onNftUpdated } from '@/lib/realtime/socket-client'
import { cn } from '@/lib/utils'

const SKELETON_CARDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
// Staggered columns on mobile, as drawn: the offset is a transform so rows keep their height.
const GRID =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 max-md:[&>*:nth-child(even)]:translate-y-8 md:grid-cols-3 md:gap-x-8 md:gap-y-16 md:pb-0'

function resultsMessage(query: UseQueryResult<NftList>, priceNotice: string | null): string {
  if (priceNotice) return priceNotice
  if (query.isPending) return 'Carregando NFTs.'
  if (query.isError) return 'Não foi possível carregar os NFTs.'

  const { totalItems } = query.data
  if (totalItems === 0) return 'Nenhum NFT encontrado.'
  return totalItems === 1 ? '1 NFT encontrado.' : `${totalItems.toString()} NFTs encontrados.`
}

function CatalogMessage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="max-w-prose text-sm text-content-secondary">{description}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

interface CatalogResultsProps {
  query: UseQueryResult<NftList>
  search: CatalogSearch
}

export function CatalogResults({ query, search }: CatalogResultsProps) {
  const { data, isPending, isError, isPlaceholderData, isFetching, error, refetch } = query
  const [priceNotice, setPriceNotice] = useState<string | null>(null)
  const items = data?.items

  // Realtime changes are visible; this tells screen readers about them too.
  useEffect(
    () =>
      onNftUpdated(({ resource, data: { priceEth } }) => {
        const nft = items?.find(({ id }) => id === resource.id)
        if (nft) setPriceNotice(`Preço de ${nft.name} atualizado para ${formatEth(priceEth)} ETH.`)
      }),
    [items],
  )

  const status = (
    <p role="status" className="sr-only">
      {resultsMessage(query, priceNotice)}
    </p>
  )

  if (isPending) {
    return (
      <>
        {status}
        <div aria-hidden="true" className={GRID}>
          {SKELETON_CARDS.map((card) => (
            <NftCardSkeleton key={card} />
          ))}
        </div>
      </>
    )
  }

  if (isError && !data) {
    const { kind, message } = normalizeApiError(error)
    return (
      <>
        {status}
        <CatalogMessage
          title={kind === 'network' ? 'Sem conexão' : 'Não foi possível carregar os NFTs'}
          description={message}
        >
          <Button
            size="sm"
            disabled={isFetching}
            onClick={() => {
              void refetch()
            }}
          >
            {isFetching ? 'Tentando...' : 'Tentar novamente'}
          </Button>
        </CatalogMessage>
      </>
    )
  }

  if (data.items.length === 0) {
    const pastTheEnd = data.totalItems > 0
    const filtered = countActiveFilters(search) > 0 || search.q !== undefined

    return (
      <>
        {status}
        <CatalogMessage
          title={pastTheEnd ? 'Esta página não existe' : 'Nenhum NFT encontrado'}
          description={
            pastTheEnd
              ? 'A busca atual tem menos páginas.'
              : 'Ajuste a busca ou os filtros para ver outros resultados.'
          }
        >
          {pastTheEnd && (
            <Button asChild size="sm">
              <Link to="/" search={{ ...search, page: undefined }}>
                Ir para a primeira página
              </Link>
            </Button>
          )}
          {!pastTheEnd && filtered && (
            <Button asChild size="sm">
              <Link to="/">Limpar busca e filtros</Link>
            </Button>
          )}
        </CatalogMessage>
      </>
    )
  }

  return (
    <>
      {status}
      {/* A failed refresh keeps what is on screen: stale data beats an empty page. */}
      {isError && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-3 text-sm">
          <span>Não foi possível atualizar os NFTs.</span>
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
      <div
        aria-busy={isPlaceholderData}
        className={cn(GRID, 'transition-opacity', isPlaceholderData && 'opacity-60')}
      >
        {data.items.map((nft) => (
          <NftCard key={nft.id} nft={nft} />
        ))}
      </div>
      <CatalogPagination search={search} totalPages={data.totalPages} />
    </>
  )
}
