import { useId, type ComponentProps } from 'react'

import { FieldLabel } from '@/components/form/field-label'
import { ChevronDownIcon } from '@/components/icons/icons'
import { cn } from '@/lib/utils'

interface SelectFieldProps extends ComponentProps<'select'> {
  label: string
  options: readonly { value: string; label: string }[]
  placeholder?: string
  error?: string | undefined
}

/** Native on purpose: keyboard, screen readers and the mobile picker come for free. */
export function SelectField({
  label,
  options,
  placeholder,
  error,
  className,
  ...props
}: SelectFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={id} visible required={props.required}>
        {label}
      </FieldLabel>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-12.5 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-base text-foreground md:h-10 md:rounded-xs md:text-sm',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(({ value, label: optionLabel }) => (
            <option key={value} value={value}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
