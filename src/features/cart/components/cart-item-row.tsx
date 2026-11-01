import { Link } from '@tanstack/react-router'

import { DeleteIcon } from '@/components/icons/icons'
import type { CartItem } from '@/contracts/cart'
import { ROW_COLUMNS } from '@/features/cart/components/cart-grid'
import { useRemoveCartItem, useUpdateCartItem } from '@/features/cart/hooks'
import { QuantityStepper } from '@/features/nft/components/quantity-stepper'
import { isApiError } from '@/lib/http/api-error'
import { formatEth } from '@/lib/money/eth'
import { showToast } from '@/lib/toast'

function availabilityWarning({ available, quantity }: CartItem): string | null {
  if (available === 0) return 'Esgotado. Remova este item para continuar.'
  if (quantity > available) return `Restam ${available.toString()}. Reduza a quantidade.`
  return null
}

export function CartItemRow({ item }: { item: CartItem }) {
  const update = useUpdateCartItem(item.id)
  const remove = useRemoveCartItem(item.id)
  const busy = update.isPending || remove.isPending
  const warning = availabilityWarning(item)

  function onRemove() {
    remove.mutate(undefined, {
      onSuccess: () => {
        showToast(`${item.name} removido do carrinho.`)
      },
      onError: (error) => {
        if (isApiError(error, 'not_found')) showToast('Este item já não estava no carrinho.')
      },
    })
  }

  return (
    <li
      aria-busy={busy}
      className={`relative flex min-h-25 items-stretch gap-2 overflow-hidden rounded-[0.875rem] bg-gradient-surface md:min-h-17.5 md:rounded-none md:bg-card md:bg-none md:pr-6 ${ROW_COLUMNS}`}
    >
      <div className="flex min-w-0 flex-1 gap-2 md:gap-4">
        <img
          src={item.image.thumbnailUrl}
          alt={item.image.alt}
          width={100}
          height={100}
          loading="lazy"
          className="size-25 shrink-0 rounded-[0.875rem] object-cover md:size-17.5 md:rounded-md"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-3 pr-9 md:py-1 md:pr-0">
          <Link
            to="/nft/$id"
            params={{ id: item.nftId }}
            className="truncate text-md leading-4 font-bold md:text-base md:leading-4"
          >
            {item.name}
          </Link>
          <p className="text-sm leading-4 text-content-secondary md:text-content-subtle">
            <span className="hidden md:inline">ID do token: {item.tokenId} · </span>
            Edição: {item.editionLabel}
          </p>
          <p className="text-lg leading-4 font-bold text-content-accent md:hidden">
            {formatEth(item.lineTotalEth)} ETH
          </p>
          {warning && (
            <p className="text-xs text-destructive">{warning}</p>
          )}
        </div>
      </div>

      <p className="hidden text-base leading-4 font-bold text-content-secondary md:block">
        <span className="sr-only">Preço unitário: </span>
        {formatEth(item.unitPriceEth)} ETH
      </p>

      <div className="absolute right-2 bottom-3 md:static">
        <QuantityStepper
          compact
          label={`Quantidade de ${item.name}`}
          value={item.quantity}
          max={item.available}
          disabled={busy}
          onChange={(quantity) => {
            update.mutate(quantity)
          }}
        />
      </div>

      <p className="hidden text-base leading-4 font-bold text-content-accent md:block">
        <span className="sr-only">Total do item: </span>
        {formatEth(item.lineTotalEth)} ETH
      </p>

      <button
        type="button"
        aria-label={`Remover ${item.name}`}
        disabled={busy}
        className="absolute top-1 right-1 flex size-8 items-center justify-center text-primary disabled:opacity-50 md:static md:size-6 md:text-content-subtle cursor-pointer hover:text-destructive duration-300 ease-in-out"
        onClick={onRemove}
      >
        <DeleteIcon className="size-6" />
      </button>
    </li>
  )
}
