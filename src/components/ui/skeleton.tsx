import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Decorative placeholder: announce loading on the container with `aria-busy`
 * or a status message. Size it like the final content to avoid layout shift.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('shimmer rounded-md', className)}
      {...props}
    />
  )
}

export { Skeleton }
