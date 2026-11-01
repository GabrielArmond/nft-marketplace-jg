import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { SearchIcon } from '@/components/icons/icons'
import { Input } from '@/components/ui/input'

/** Figma only draws the icon: the field opens on demand and searches the catalog. */
export function HeaderSearch() {
  const navigate = useNavigate()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
    toggleRef.current?.focus()
  }

  return (
    <div className="flex items-center gap-2">
      {open && (
        <form
          role="search"
          className="w-48"
          onSubmit={(event) => {
            event.preventDefault()
            const q = inputRef.current?.value.trim()
            setOpen(false)
            void navigate({ to: '/', hash: 'catalogo', search: { q: q || undefined } })
          }}
        >
          <Input
            ref={inputRef}
            autoFocus
            type="search"
            aria-label="Buscar NFTs"
            placeholder="Explorar coleções"
            className="h-9 md:h-9"
            onKeyDown={(event) => {
              if (event.key === 'Escape') close()
            }}
          />
        </form>
      )}
      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? 'Fechar busca' : 'Buscar no catálogo'}
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current)
        }}
      >
        <SearchIcon className="size-5" />
      </button>
    </div>
  )
}
