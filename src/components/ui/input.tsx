import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * 50px/10px radius on mobile and 40px/5px from `md`, as in the Figma forms. The
 * mobile size stays 16px: anything smaller makes iOS zoom in on focus.
 */
function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-12.5 w-full rounded-xl border border-input bg-transparent px-4 text-base text-foreground placeholder:text-content-subtle focus:border-primary disabled:opacity-50 aria-invalid:border-destructive md:h-10 md:rounded-control md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
