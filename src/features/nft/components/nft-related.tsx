import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'

import { CarouselDots } from '@/components/ui/carousel-dots'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { nftListQueryOptions } from '@/features/catalog/queries'
import { useScrollPages } from '@/hooks/use-scroll-pages'

const VISIBLE_ITEMS = 12
// Extra items, so the row stays full after removing what the page already shows.
const RELATED_PARAMS = { pageSize: VISIBLE_ITEMS + 4 }
const SKELETONS = ['a', 'b', 'c', 'd', 'e', 'f']
// Whole items per page: 2 on mobile, 3 on tablet and 5 on desktop.
const ITEM =
  'w-[calc(50%-0.5rem)] shrink-0 snap-start md:w-[calc((100%-3.5rem)/3)] lg:w-[calc((100%-7rem)/5)]'

/** Secondary content: if it fails, the page simply goes without it. */
export function NftRelated({
  title = 'Mais desta coleção',
  excludeIds,
}: {
  title?: string
  excludeIds: readonly string[]
}) {
  const row = useRef<HTMLDivElement>(null)
  const { data, isPending, isError } = useQuery(nftListQueryOptions(RELATED_PARAMS))
  const items = data?.items.filter(({ id }) => !excludeIds.includes(id)).slice(0, VISIBLE_ITEMS)
  const { pages, page, goTo } = useScrollPages(row, items?.length ?? 0)

  if (isError) return null

  return (
    <section aria-labelledby="relacionados-titulo" className="mt-14 px-6 md:mt-20 md:px-0">
      <h2
        id="relacionados-titulo"
        className="mb-8 border-b border-primary/30 pb-3 text-body-lg leading-4 font-bold text-content-accent"
      >
        {title}
      </h2>
      {/* Focusable, so the arrow keys scroll the row. */}
      <div
        ref={row}
        role="group"
        tabIndex={0}
        aria-label={`${title}, lista com rolagem horizontal`}
        aria-busy={isPending}
        className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] md:gap-7"
      >
        {items
          ? items.map((nft) => (
              <div key={nft.id} className={ITEM}>
                <NftCard nft={nft} />
              </div>
            ))
          : SKELETONS.map((item) => (
              <div key={item} className={ITEM}>
                <NftCardSkeleton />
              </div>
            ))}
      </div>
      <CarouselDots label={title} pages={pages} page={page} onSelect={goTo} />
    </section>
  )
}
