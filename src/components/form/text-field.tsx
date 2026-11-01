import { useId, type ComponentProps, type ReactNode } from 'react'

import { FieldLabel } from '@/components/form/field-label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TextFieldProps extends ComponentProps<'input'> {
  /** Most layouts only show placeholders: the label is kept for assistive technology. */
  label: string
  showLabel?: boolean
  error?: string | undefined
  trailing?: ReactNode
}

export function TextField({
  label,
  showLabel = false,
  error,
  trailing,
  className,
  ...props
}: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={id} visible={showLabel} required={props.required}>
        {label}
      </FieldLabel>
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
