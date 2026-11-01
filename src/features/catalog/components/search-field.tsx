import { useEffect, useState } from 'react'

import { SearchFieldIcon } from '@/components/icons/icons'

const DEBOUNCE_MS = 300

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
}

/** Search as you type, without one history entry or request per keystroke. */
export function SearchField({ value, onChange }: SearchFieldProps) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  // Back and forward change the URL from outside: the field must follow.
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  useEffect(() => {
    const next = draft.trim()
    if (next === value) return undefined

    const timer = setTimeout(() => {
      onChange(next)
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [draft, value, onChange])

  return (
    <form
      role="search"
      className="flex h-11.25 min-w-0 flex-1 items-center gap-2 rounded-xl bg-card px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring"
      onSubmit={(event) => {
        event.preventDefault()
        onChange(draft.trim())
      }}
    >
      <SearchFieldIcon className="size-5.5 shrink-0 text-content-subtle" />
      <input
        type="search"
        aria-label="Buscar NFTs"
        placeholder="Explorar coleções"
        value={draft}
        className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none placeholder:text-content-subtle md:text-sm"
        onChange={(event) => {
          setDraft(event.target.value)
        }}
      />
    </form>
  )
}
