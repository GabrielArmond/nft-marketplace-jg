import { Skeleton } from '@/components/ui/skeleton'

const ROWS = ['a', 'b', 'c']
const LINES = ['a', 'b', 'c', 'd']

export function CartListSkeleton() {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-5 md:gap-3">
      {ROWS.map((row) => (
        <li key={row}>
          <Skeleton className="h-25 rounded-[0.875rem] md:h-17.5 md:rounded-none" />
        </li>
      ))}
    </ul>
  )
}

export function CartSummarySkeleton() {
  return (
    <div aria-hidden="true" className="mt-6 flex flex-col gap-5 px-6 md:px-0 xl:mt-0">
      <Skeleton className="h-10" />
      {LINES.map((line) => (
        <Skeleton key={line} className="h-5" />
      ))}
      <Skeleton className="h-15 rounded-pill md:h-10 md:rounded-xs" />
    </div>
  )
}
