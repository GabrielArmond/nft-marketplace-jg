import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { LinkedinIcon, MailIcon, ShopIcon, StarIcon, TwitterIcon } from '@/components/icons/icons'
import { Button } from '@/components/ui/button'
import type { NftDetail } from '@/contracts/nfts'
import { useAddToCart, useCartQuantity } from '@/features/cart/hooks'
import { FavoriteTextButton } from '@/features/favorites/components/favorite-button'
import { EditionPicker } from '@/features/nft/components/edition-picker'
import { QuantityStepper } from '@/features/nft/components/quantity-stepper'
import {
  initialSelection,
  reconcileSelection,
  remainingFor,
  type Selection,
} from '@/features/nft/selection'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'
import { formatEth, multiplyEth } from '@/lib/money/eth'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const STARS = [1, 2, 3, 4, 5]

function ShareLinks({ name }: { name: string }) {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(name)
  const LINK = 'flex size-6 items-center justify-center'

  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-md leading-4 font-bold">Compartilhar este NFT:</span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no LinkedIn (abre em nova aba)"
        className={LINK}
      >
        <LinkedinIcon className="size-3.75" />
      </a>
      <a href={`mailto:?subject=${text}&body=${url}`} aria-label="Compartilhar por e-mail" className={LINK}>
        <MailIcon className="size-4.5" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${url}&text=${text}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Compartilhar no Twitter (abre em nova aba)"
        className={LINK}
      >
        <TwitterIcon className="h-3 w-4" />
      </a>
    </div>
  )
}

export function NftPurchasePanel({ nft }: { nft: NftDetail }) {
  const router = useRouter()
  const addToCart = useAddToCart()
  const [selection, setSelection] = useState<Selection>(() => initialSelection(nft))
  const [notice, setNotice] = useState<string | null>(null)
  const inCart = useCartQuantity(selection.editionId)

  // Adjusted during render: an effect would paint one frame with an invalid choice.
  const reconciled = reconcileSelection(nft, selection, inCart)
  if (reconciled.selection !== selection) {
    setSelection(reconciled.selection)
    setNotice(reconciled.notice)
  }

  const current = reconciled.selection
  const edition = nft.editions.find(({ id }) => id === current.editionId)
  const [lastPrice, setLastPrice] = useState(`${current.editionId}:${edition?.priceEth ?? ''}`)
  const priceKey = `${current.editionId}:${edition?.priceEth ?? ''}`

  if (priceKey !== lastPrice) {
    const sameEdition = lastPrice.startsWith(`${current.editionId}:`)
    setLastPrice(priceKey)
    if (sameEdition && edition) {
      setNotice(`Preço atualizado para ${formatEth(edition.priceEth)} ETH.`)
    }
  }

  if (!edition) return null

  const available = edition.available > 0
  const remaining = remainingFor(edition, inCart)
  const canBuy = available && remaining > 0
  const buyLabel = available ? 'Comprar' : 'Esgotado'

  async function add(): Promise<boolean> {
    try {
      await addToCart.mutateAsync({
        nftId: nft.id,
        editionId: current.editionId,
        quantity: current.quantity,
      })
      return true
    } catch (error) {
      if (!isApiError(error, 'unauthorized')) {
        showToast(normalizeApiError(error).message, 'error')
      }
      return false
    }
  }

  async function onAdd() {
    if (await add()) showToast(`${nft.name} adicionado ao carrinho.`)
  }

  async function onBuy() {
    if (await add()) void router.navigate({ to: '/carrinho' })
  }

  const status = !available
    ? 'Esta edição está esgotada.'
    : remaining === 0
      ? 'Todas as unidades disponíveis desta edição já estão no seu carrinho.'
      : null

  return (
    <div className="relative z-10 -mt-10 flex flex-col gap-3 rounded-t-[1.9375rem] bg-card px-6 pt-8 pb-6 md:mt-0 md:gap-5 md:rounded-none md:bg-transparent md:p-0">
      <div className="flex items-center justify-between gap-3 md:block">
        <h1 className="text-xl leading-4 font-bold md:text-3xl">{nft.name}</h1>
        <p
          aria-label={`Nota ${nft.rating.toString()}, ${nft.reviewCount.toString()} avaliações`}
          className="flex h-6.75 shrink-0 items-center gap-1 rounded-full border border-primary px-1.5 text-sm md:hidden"
        >
          <StarIcon className="size-3.5 text-amber" />
          <span className="font-medium">{nft.rating.toFixed(1)}</span>
          <span className="text-content-secondary">({nft.reviewCount})</span>
        </p>
        <div className="mt-3 hidden items-center justify-between gap-4 border-b border-primary/30 pb-3 md:flex">
          <p className="text-title leading-5 font-bold text-content-accent">
            {formatEth(edition.priceEth)} ETH
          </p>
          <p className="flex items-center gap-1 text-md">
            <span
              role="img"
              aria-label={`Nota ${nft.rating.toString()} de 5`}
              className="flex gap-1 text-amber"
            >
              {STARS.map((star) => (
                <StarIcon
                  key={star}
                  className={cn('size-3.5', star > Math.round(nft.rating) && 'opacity-30')}
                />
              ))}
            </span>
            {nft.reviewCount} avaliações de colecionadores
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="hidden text-md leading-4 font-bold md:block">Sobre este NFT:</h2>
        <p className="text-sm leading-6 text-content-secondary">{nft.description}</p>
      </div>

      <EditionPicker
        editions={nft.editions}
        selectedId={current.editionId}
        onSelect={(editionId) => {
          setNotice(null)
          setSelection({ editionId, quantity: 1 })
        }}
      />

      <p className="min-h-5 text-sm text-content-secondary">
        {available ? `${edition.available.toString()} disponíveis` : 'Esgotada'}
      </p>

      {/* Always mounted, or screen readers would miss the first message. */}
      <p role="status" className="text-sm text-content-accent empty:sr-only">
        {notice ?? status}
      </p>

      <div className="hidden items-center justify-between gap-4 md:flex">
        <QuantityStepper
          value={current.quantity}
          max={Math.max(remaining, 1)}
          onChange={(quantity) => {
            setSelection({ ...current, quantity })
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            size="default"
            disabled={!canBuy || addToCart.isPending}
            className="w-32.5 rounded-md uppercase"
            onClick={() => {
              void onBuy()
            }}
          >
            {buyLabel}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Adicionar ao carrinho"
            disabled={!canBuy || addToCart.isPending}
            className="rounded-md border-primary text-primary"
            onClick={() => {
              void onAdd()
            }}
          >
            <ShopIcon className="size-5" />
          </Button>
          <FavoriteTextButton nft={nft} />
        </div>
      </div>

      <dl className="flex flex-col gap-3 text-md text-content-subtle">
        <div className="flex gap-1">
          <dt>ID do token:</dt>
          <dd>{nft.tokenId}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Coleção:</dt>
          <dd>{nft.collection}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Atributos:</dt>
          <dd>{nft.attributes.join(', ')}</dd>
        </div>
      </dl>

      <div className="hidden md:block">
        <ShareLinks name={nft.name} />
      </div>

      {/* Fixed on mobile, replacing the tab bar, as in the frame. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-5 rounded-t-[2.5rem] bg-card px-6 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-ambient md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-md leading-4 font-medium text-content-secondary">Qtd.</span>
            <QuantityStepper
              value={current.quantity}
              max={Math.max(remaining, 1)}
              onChange={(quantity) => {
                setSelection({ ...current, quantity })
              }}
            />
          </div>
          <p className="text-xl leading-4 font-bold text-content-accent">
            {formatEth(multiplyEth(edition.priceEth, current.quantity))} ETH
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="gradient"
            size="cta"
            disabled={!canBuy || addToCart.isPending}
            className="flex-1"
            onClick={() => {
              void onBuy()
            }}
          >
            {available ? 'Comprar NFT' : 'Esgotado'}
          </Button>
          <button
            type="button"
            aria-label="Adicionar ao carrinho"
            disabled={!canBuy || addToCart.isPending}
            className="flex size-15 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-content-subtle disabled:opacity-50"
            onClick={() => {
              void onAdd()
            }}
          >
            <ShopIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
