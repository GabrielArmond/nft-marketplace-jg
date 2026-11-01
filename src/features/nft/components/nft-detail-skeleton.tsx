import { Skeleton } from '@/components/ui/skeleton'

const THUMBNAILS = ['a', 'b', 'c', 'd']
const LINES = ['a', 'b', 'c']

/** Mirrors the real grid so the page does not jump when the data lands. */
export function NftDetailSkeleton() {
  return (
    <div aria-busy="true" className="md:page-container md:pt-8">
      <p role="status" className="sr-only">
        Carregando NFT.
      </p>
      <div className="md:grid md:gap-8 xl:grid-cols-[35.8125rem_minmax(0,1fr)]">
        <div className="px-7 pt-6 pb-16 md:grid md:max-w-143.25 md:grid-cols-[6.25rem_minmax(0,1fr)] md:gap-7 md:p-0">
          <div className="hidden flex-col gap-4 md:flex">
            {THUMBNAILS.map((item) => (
              <Skeleton key={item} className="size-25 rounded-lg" />
            ))}
          </div>
          <Skeleton className="aspect-square rounded-3xl md:rounded-md" />
        </div>
        <div className="flex flex-col gap-5 px-6 md:px-0">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          {LINES.map((item) => (
            <Skeleton key={item} className="h-5 w-full" />
          ))}
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-12.5 w-full" />
        </div>
      </div>
    </div>
  )
}
