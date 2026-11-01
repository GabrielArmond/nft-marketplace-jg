import { Link } from '@tanstack/react-router'

import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '@/contracts/nfts'
import { formatEth } from '@/lib/money/eth'

// Same box for the image in the card and in its skeleton: nothing shifts when data lands.
const ART_FRAME =
  'relative aspect-[175/200] overflow-hidden rounded-3xl bg-gradient-surface md:aspect-[258/300] md:rounded-none md:bg-card md:bg-none'
const ART = 'absolute inset-1 top-1/2 h-auto -translate-y-1/2 rounded-2xl'
const SIZES = '(min-width: 1280px) 258px, (min-width: 768px) 30vw, 50vw'

function Tag({ label }: { label: string }) {
  return (
    <span className="absolute top-4 left-0 z-10 bg-primary px-3.5 py-1.5 text-caption leading-4 font-medium text-primary-foreground">
      {label}
    </span>
  )
}

export function NftCard({ nft }: { nft: NftSummary }) {
  const { id, image, name, priceEth, compareAtPriceEth, isRare, soldOut } = nft

  return (
    <article>
      <Link to="/nft/$id" params={{ id }} className="flex flex-col gap-2 md:gap-3">
        <div className={ART_FRAME}>
          {soldOut ? <Tag label="ESGOTADO" /> : isRare && <Tag label="RARO" />}
          <img
            src={image.thumbnailUrl}
            srcSet={`${image.thumbnailUrl} 320w, ${image.url} 640w`}
            sizes={SIZES}
            alt={image.alt}
            width={250}
            height={250}
            loading="lazy"
            decoding="async"
            className={`${ART} w-[calc(100%-0.5rem)]`}
          />
        </div>
        <div className="flex flex-col pl-2 md:gap-3 md:pl-0">
          <h3 className="truncate text-md md:text-base md:leading-4">{name}</h3>
          <p className="flex flex-wrap gap-x-3 text-base leading-4 font-bold text-content-accent md:text-lg md:leading-4">
            <span>{formatEth(priceEth)} ETH</span>
            {compareAtPriceEth && (
              <s className="font-normal text-content-subtle">
                <span className="sr-only">Preço anterior: </span>
                {formatEth(compareAtPriceEth)} ETH
              </s>
            )}
          </p>
        </div>
      </Link>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <Skeleton className="aspect-[175/200] rounded-3xl md:aspect-[258/300] md:rounded-none" />
      <div className="flex flex-col gap-1 pl-2 md:gap-3 md:pl-0">
        <Skeleton className="h-5 w-3/4 md:h-4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
