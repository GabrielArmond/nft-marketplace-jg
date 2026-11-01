import { useId } from 'react'

import { ChevronDownIcon } from '@/components/icons/icons'
import { NFT_SORTS, type NftSort } from '@/contracts/nfts'
import { SORT_LABELS } from '@/features/catalog/search-params'

interface SortSelectProps {
  value: NftSort
  onChange: (value: NftSort) => void
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  const id = useId()

  return (
    <div className="flex items-center gap-2 text-md">
      <label htmlFor={id} className="shrink-0">
        Ordenar por:
      </label>
      <span className="relative">
        <select
          id={id}
          value={value}
          className="appearance-none bg-transparent pr-6"
          onChange={(event) => {
            const next = NFT_SORTS.find((sort) => sort === event.target.value)
            if (next) onChange(next)
          }}
        >
          {NFT_SORTS.map((sort) => (
            <option key={sort} value={sort} className="bg-card">
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2" />
      </span>
    </div>
  )
}
