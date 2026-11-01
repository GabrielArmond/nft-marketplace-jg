import { Dialog } from 'radix-ui'
import { useRef } from 'react'

import { CloseIcon } from '@/components/icons/icons'
import { Button } from '@/components/ui/button'
import type { NftFacets } from '@/contracts/nfts'
import { FilterPanel } from '@/features/catalog/components/filter-panel'
import { SortSelect } from '@/features/catalog/components/sort-select'
import type { CatalogSearch } from '@/features/catalog/search-params'

interface FiltersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: CatalogSearch
  facets: NftFacets | undefined
  totalItems: number | undefined
  onChange: (changes: Partial<CatalogSearch>) => void
}

/** Below `xl` the sidebar becomes this sheet. */
export function FiltersDialog({
  open,
  onOpenChange,
  search,
  facets,
  totalItems,
  onChange,
}: FiltersDialogProps) {
  const openedFrom = useRef<HTMLElement | null>(null)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-card shadow-ambient-lg"
          onOpenAutoFocus={() => {
            // There are two openers and no Dialog.Trigger, so Radix cannot restore focus.
            const { activeElement } = document
            openedFrom.current = activeElement instanceof HTMLElement ? activeElement : null
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            openedFrom.current?.focus()
          }}
        >
          <div className="flex items-center justify-between p-5">
            <Dialog.Title className="text-xl font-bold">Filtros</Dialog.Title>
            <Dialog.Close
              aria-label="Fechar filtros"
              className="flex size-8 items-center justify-center text-primary"
            >
              <CloseIcon className="size-4.5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <div className="mb-8">
              <SortSelect
                value={search.sort ?? 'recent'}
                onChange={(sort) => {
                  onChange({ sort: sort === 'recent' ? undefined : sort })
                }}
              />
            </div>
            <FilterPanel search={search} facets={facets} onChange={onChange} />
          </div>

          <div className="p-5">
            <Dialog.Close asChild>
              <Button size="lg" className="w-full">
                {totalItems === undefined ? 'Ver resultados' : `Ver ${totalItems.toString()} resultados`}
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
