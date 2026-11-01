import { useId, type ComponentProps } from 'react'

import { FieldLabel } from '@/components/form/field-label'

interface TextareaFieldProps extends ComponentProps<'textarea'> {
  label: string
  error?: string | undefined
}

export function TextareaField({ label, error, ...props }: TextareaFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={id} visible>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-38 w-full resize-y rounded-xl border border-input bg-transparent p-3 text-base text-foreground md:rounded-xs md:text-sm"
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
