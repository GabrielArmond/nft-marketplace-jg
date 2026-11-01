import { Skeleton } from '@/components/ui/skeleton'

const FIELDS = ['a', 'b', 'c', 'd', 'e', 'f']

export function AccountSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-5 md:grid-cols-2 md:gap-x-7">
      {FIELDS.map((field) => (
        <Skeleton key={field} className="h-17" />
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}
