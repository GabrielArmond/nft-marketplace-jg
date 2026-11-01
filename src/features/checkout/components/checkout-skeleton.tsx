import { Skeleton } from '@/components/ui/skeleton'

const FIELDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const SUMMARY = ['a', 'b', 'c', 'd']

export function CheckoutSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-8 pt-8 page-container xl:grid-cols-[minmax(0,1fr)_25.3125rem]"
    >
      <div className="grid gap-3 md:grid-cols-2 md:gap-6">
        {FIELDS.map((field) => (
          <Skeleton key={field} className="h-17" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {SUMMARY.map((line) => (
          <Skeleton key={line} className="h-17.5" />
        ))}
        <Skeleton className="h-11.25" />
      </div>
    </div>
  )
}

export function OrderSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto flex w-full max-w-144.5 flex-col gap-4 px-7 py-10">
      <Skeleton className="mx-auto size-20 rounded-full" />
      <Skeleton className="h-16" />
      {SUMMARY.map((line) => (
        <Skeleton key={line} className="h-17.5" />
      ))}
    </div>
  )
}
