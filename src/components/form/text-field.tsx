import { useId, type ComponentProps, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TextFieldProps extends ComponentProps<'input'> {
  /** The layout only shows placeholders: the label is kept for assistive technology. */
  label: string
  error?: string | undefined
  trailing?: ReactNode
}

export function TextField({ label, error, trailing, className, ...props }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(trailing ? 'pr-12' : undefined, className)}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
