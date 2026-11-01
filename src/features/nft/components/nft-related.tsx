import { useQuery } from '@tanstack/react-query'

import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { nftListQueryOptions } from '@/features/catalog/queries'

const VISIBLE_ITEMS = 5
// Extra items, so the row stays full after removing what the page already shows.
const RELATED_PARAMS = { pageSize: VISIBLE_ITEMS * 3 }
const SKELETONS = ['a', 'b', 'c', 'd', 'e']
const ROW = 'flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible lg:grid-cols-5'
const ITEM = 'w-44 shrink-0 md:w-auto'

/** Secondary content: if it fails, the page simply goes without it. */
export function NftRelated({
  title = 'Mais desta coleção',
  excludeIds,
}: {
  title?: string
  excludeIds: readonly string[]
}) {
  const { data, isPending, isError } = useQuery(nftListQueryOptions(RELATED_PARAMS))
  if (isError) return null

  const items = data?.items.filter(({ id }) => !excludeIds.includes(id)).slice(0, VISIBLE_ITEMS)

  return (
    <section aria-labelledby="relacionados-titulo" className="mt-14 px-6 md:mt-20 md:px-0">
      <h2
        id="relacionados-titulo"
        className="mb-8 border-b border-primary/30 pb-3 text-body-lg leading-4 font-bold text-content-accent"
      >
        {title}
      </h2>
      <div aria-busy={isPending} className={ROW}>
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
    </section>
  )
}
