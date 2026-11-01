import { useSyncExternalStore } from 'react'

import { getToasts, subscribeToToasts, type Toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const TOAST = 'rounded-md border bg-popover px-4 py-3 text-sm shadow-float'

function ToastList({ toasts }: { toasts: readonly Toast[] }) {
  return toasts.map(({ id, message, tone }) => (
    <p key={id} className={cn(TOAST, tone === 'error' ? 'border-destructive' : 'border-primary')}>
      {message}
    </p>
  ))
}

/** Both live regions stay mounted: a region created with its text is often not announced. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToToasts, getToasts)

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-44 z-50 flex flex-col items-end gap-2 md:right-6 md:bottom-6 md:left-auto md:w-90">
      <div role="status" className="flex w-full flex-col gap-2">
        <ToastList toasts={toasts.filter(({ tone }) => tone === 'info')} />
      </div>
      <div role="alert" className="flex w-full flex-col gap-2">
        <ToastList toasts={toasts.filter(({ tone }) => tone === 'error')} />
      </div>
    </div>
  )
}
