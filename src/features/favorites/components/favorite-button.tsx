import type { ComponentProps } from 'react'

import { HeartIcon, HeartOutlineIcon } from '@/components/icons/icons'
import type { NftSummary } from '@/contracts/nfts'
import { useFavoriteToggle } from '@/features/favorites/hooks'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps extends Omit<ComponentProps<'button'>, 'onClick'> {
  nft: NftSummary
}

/** Round icon button of the cards and the mobile detail. */
export function FavoriteButton({ nft, className, ...props }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavoriteToggle(nft)
  const Icon = isFavorite ? HeartIcon : HeartOutlineIcon

  return (
    <button
      type="button"
      aria-label={`Favoritar ${nft.name}`}
      aria-pressed={isFavorite}
      className={cn(
        'flex size-8.75 items-center justify-center rounded-full border border-border bg-surface-raised text-primary',
        className,
      )}
      onClick={toggle}
      {...props}
    >
      <Icon className="h-4 w-4.5" />
    </button>
  )
}

/** Labelled version of the desktop detail. */
export function FavoriteTextButton({ nft }: { nft: NftSummary }) {
  const { isFavorite, toggle } = useFavoriteToggle(nft)
  const Icon = isFavorite ? HeartIcon : HeartOutlineIcon

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      className="flex h-10 w-32.5 items-center justify-center gap-2 rounded-md border border-primary text-sm font-medium text-content-accent"
      onClick={toggle}
    >
      <Icon className="size-5 text-primary" />
      {isFavorite ? 'Favoritado' : 'Favoritar'}
    </button>
  )
}
