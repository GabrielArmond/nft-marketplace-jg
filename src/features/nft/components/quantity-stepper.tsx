import { MinusIcon, PlusIcon } from '@/components/icons/icons'
import { cn } from '@/lib/utils'

// 20x30 on mobile and 33x50 from `md`, as in the frames; the hit area keeps 24px minimum.
const STEP =
  'flex h-7.5 w-6 items-center justify-center rounded-full border border-ink bg-primary text-primary-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
const LARGE_STEP = 'md:h-12.5 md:w-8.25'
// Mobile cart rows use neutral round buttons; from `md` they match the rest of the table.
const COMPACT_STEP = 'max-md:size-6 max-md:border-border max-md:bg-surface-raised max-md:text-foreground'

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  /** Keeps the small size at every width, as in the cart rows. */
  compact?: boolean
  label?: string
}

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
  compact = false,
  label = 'Quantidade',
}: QuantityStepperProps) {
  const step = cn(STEP, compact ? COMPACT_STEP : LARGE_STEP)
  const icon = cn('size-4', !compact && 'md:size-6')

  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= 1}
        className={step}
        onClick={() => {
          onChange(value - 1)
        }}
      >
        <MinusIcon className={icon} />
      </button>
      <output aria-live="polite" className="min-w-3 text-center text-lg font-medium">
        {value}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        className={step}
        onClick={() => {
          onChange(value + 1)
        }}
      >
        <PlusIcon className={icon} />
      </button>
    </div>
  )
}
