import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { StatusScreen } from '@/components/feedback/status-screen'
import { BackButton } from '@/components/layout/back-button'
import { Button } from '@/components/ui/button'
import { ROW_COLUMNS } from '@/features/cart/components/cart-grid'
import { CartItemRow } from '@/features/cart/components/cart-item-row'
import { CartListSkeleton, CartSummarySkeleton } from '@/features/cart/components/cart-skeleton'
import { CartSummary } from '@/features/cart/components/cart-summary'
import { cartQueryOptions } from '@/features/cart/queries'
import { NftRelated } from '@/features/nft/components/nft-related'
import { normalizeApiError } from '@/lib/http/api-error'
import { formatEth } from '@/lib/money/eth'
import { onNftUpdated } from '@/lib/realtime/socket-client'

function PageHeading() {
  return (
    <>
      <nav aria-label="Trilha" className="mb-3 hidden text-md leading-4 font-bold md:block">
        <Link to="/">Início</Link>
        {' / '}
        <Link to="/" hash="catalogo">
          Mercado
        </Link>
        {' / Carrinho'}
      </nav>
      <div className="relative mb-3 flex h-11 items-center justify-center px-7 md:hidden">
        <div className="absolute left-7">
          <BackButton />
        </div>
        <h1 className="text-xl leading-4 font-bold">Carrinho de NFTs</h1>
      </div>
      <h1 className="sr-only max-md:hidden">Carrinho de NFTs</h1>
    </>
  )
}

export function CartPage() {
  const { data, error, isPending, isFetching, refetch } = useQuery(cartQueryOptions)
  const [notice, setNotice] = useState<string | null>(null)
  const items = data?.items

  // The cart itself refreshes through the realtime sync: this explains why it changed.
  useEffect(
    () =>
      onNftUpdated(({ data: { editions } }) => {
        for (const item of items ?? []) {
          const edition = editions.find(({ id }) => id === item.editionId)
          if (!edition) continue

          if (edition.available < item.quantity) {
            setNotice(`${item.name}: restam ${edition.available.toString()} unidades.`)
          } else if (edition.priceEth !== item.unitPriceEth) {
            setNotice(`O preço de ${item.name} mudou para ${formatEth(edition.priceEth)} ETH.`)
          }
        }
      }),
    [items],
  )

  if (error && !data) {
    return (
      <StatusScreen
        eyebrow="Erro"
        title="Não foi possível carregar o carrinho"
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
        eyebrow="Carrinho de NFTs"
        title="Seu carrinho está vazio"
        description="Explore o catálogo e adicione os NFTs que quiser colecionar."
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
    <div className="pt-8 md:page-container">
      <PageHeading />

      {/* Always mounted, or screen readers would miss the first message. */}
      <p role="status" className="px-7 pb-3 text-sm text-content-accent empty:sr-only md:px-0">
        {isPending ? 'Carregando carrinho.' : notice}
      </p>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 px-7 pb-3 text-sm md:px-0"
        >
          <span>Não foi possível atualizar o carrinho.</span>
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

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_20.75rem] xl:gap-21.5">
        <section aria-label="Itens do carrinho" className="px-7 md:px-0">
          <div
            aria-hidden="true"
            className={`mb-3 hidden border-b border-primary/30 pr-6 pb-3 text-base leading-4 font-bold ${ROW_COLUMNS}`}
          >
            <span>NFTs</span>
            <span>Preço</span>
            <span>Edições</span>
            <span>Total</span>
          </div>
          {data ? (
            <ul className="flex flex-col gap-5 md:gap-3">
              {data.items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <CartListSkeleton />
          )}
        </section>

        {data ? <CartSummary cart={data} /> : <CartSummarySkeleton />}
      </div>

      <NftRelated
        title="Colecionadores também viram"
        excludeIds={data?.items.map(({ nftId }) => nftId) ?? []}
      />
    </div>
  )
}
