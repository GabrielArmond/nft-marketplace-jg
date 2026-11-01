import type { Edition } from '@/contracts/nfts'
import { cn } from '@/lib/utils'

interface EditionPickerProps {
  editions: Edition[]
  selectedId: string
  onSelect: (id: string) => void
}

export function EditionPicker({ editions, selectedId, onSelect }: EditionPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2 md:gap-3">
      <legend className="mb-2 text-md leading-4 font-bold md:mb-3">Edição:</legend>
      <div className="flex flex-wrap gap-3 md:gap-1.5">
        {editions.map(({ id, label, available }) => {
          const selected = id === selectedId
          const soldOut = available === 0

          return (
            <label
              key={id}
              className={cn(
                'flex h-7 items-center rounded-full border px-2 text-sm leading-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
                selected
                  ? 'border-primary font-medium text-content-accent'
                  : 'border-border text-content-secondary',
                soldOut ? 'cursor-not-allowed line-through opacity-60' : 'cursor-pointer',
              )}
            >
              <input
                type="radio"
                name="edicao"
                value={id}
                checked={selected}
                disabled={soldOut}
                className="sr-only"
                onChange={() => {
                  onSelect(id)
                }}
              />
              {label}
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
