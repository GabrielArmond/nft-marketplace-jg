import { Slider } from 'radix-ui'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NETWORKS, type Network } from '@/contracts/common'
import { NFT_CATEGORIES, type NftCategory, type NftFacets } from '@/contracts/nfts'
import {
  CATEGORY_LABELS,
  countActiveFilters,
  NETWORK_LABELS,
  type CatalogSearch,
} from '@/features/catalog/search-params'
import { centsToEth, ethToCents } from '@/lib/money/eth'
import { cn } from '@/lib/utils'

const SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e', 'f']
const LEGEND = 'mb-3 text-lg leading-4 font-bold'

function toggle<Value extends string>(list: readonly Value[] = [], value: Value): Value[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

interface FilterOptionProps {
  label: string
  count: number
  checked: boolean
  onChange: () => void
}

function FilterOption({ label, count, checked, onChange }: FilterOptionProps) {
  return (
    <label
      className={cn(
        'flex h-10 cursor-pointer items-center justify-between gap-2 rounded-sm px-3 text-md focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ring',
        checked ? 'font-bold text-content-accent' : 'text-content-secondary',
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <span className="flex items-center gap-2">
        {/* Colour alone must not carry the selected state. */}
        {checked && <span aria-hidden="true">✓</span>}
        {label}
      </span>
      <span className="font-bold">
        <span className="sr-only">, {count} NFTs</span>
        <span aria-hidden="true">({count})</span>
      </span>
    </label>
  )
}

function FilterGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className={LEGEND}>{legend}</legend>
      {children}
    </fieldset>
  )
}

function OptionsSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-3">
      {SKELETON_ROWS.map((row) => (
        <Skeleton key={row} className="h-7 w-full" />
      ))}
    </div>
  )
}

interface PriceFilterProps {
  range: NftFacets['priceRange']
  search: CatalogSearch
  onChange: (changes: Partial<CatalogSearch>) => void
}

function PriceFilter({ range, search, onChange }: PriceFilterProps) {
  const min = ethToCents(range.minEth)
  const max = ethToCents(range.maxEth)
  const [draft, setDraft] = useState<number[]>([
    search.minPriceEth === undefined ? min : ethToCents(search.minPriceEth),
    search.maxPriceEth === undefined ? max : ethToCents(search.maxPriceEth),
  ])
  const [low = min, high = max] = draft

  function apply() {
    onChange({
      minPriceEth: low > min ? centsToEth(low) : undefined,
      maxPriceEth: high < max ? centsToEth(high) : undefined,
    })
  }

  return (
    <div className="flex flex-col gap-3 pl-3">
      <Slider.Root
        className="relative flex h-5 touch-none items-center select-none"
        min={min}
        max={max}
        step={1}
        minStepsBetweenThumbs={1}
        value={draft}
        onValueChange={setDraft}
      >
        <Slider.Track className="relative h-0.5 grow bg-primary/30">
          <Slider.Range className="absolute h-full bg-primary" />
        </Slider.Track>
        <Slider.Thumb
          aria-label="Preço mínimo"
          aria-valuetext={`${formatPrice(low)} ETH`}
          className="block size-3.75 rounded-full border-2 border-background bg-primary"
        />
        <Slider.Thumb
          aria-label="Preço máximo"
          aria-valuetext={`${formatPrice(high)} ETH`}
          className="block size-3.75 rounded-full border-2 border-background bg-primary"
        />
      </Slider.Root>
      <p className="text-md">
        Preço: {formatPrice(low)} - {formatPrice(high)} ETH
      </p>
      <Button size="sm" className="w-23" onClick={apply}>
        Aplicar
      </Button>
    </div>
  )
}

interface FilterPanelProps {
  search: CatalogSearch
  facets: NftFacets | undefined
  onChange: (changes: Partial<CatalogSearch>) => void
}

export function FilterPanel({ search, facets, onChange }: FilterPanelProps) {
  function selectCategory(category: NftCategory) {
    const categories = toggle(search.categories, category)
    onChange({ categories: categories.length > 0 ? categories : undefined })
  }

  function selectNetwork(network: Network) {
    const networks = toggle(search.networks, network)
    onChange({ networks: networks.length > 0 ? networks : undefined })
  }

  return (
    <div className="flex flex-col gap-10">
      <FilterGroup legend="Coleções">
        {facets ? (
          NFT_CATEGORIES.map((category) => (
            <FilterOption
              key={category}
              label={CATEGORY_LABELS[category]}
              count={facets.categories.find(({ id }) => id === category)?.count ?? 0}
              checked={search.categories?.includes(category) ?? false}
              onChange={() => {
                selectCategory(category)
              }}
            />
          ))
        ) : (
          <OptionsSkeleton />
        )}
      </FilterGroup>

      <FilterGroup legend="Faixa de preço">
        {facets ? (
          // Remounts when the URL or the bounds change: back and forward must show in it.
          <PriceFilter
            key={[
              search.minPriceEth,
              search.maxPriceEth,
              facets.priceRange.minEth,
              facets.priceRange.maxEth,
            ].join()}
            range={facets.priceRange}
            search={search}
            onChange={onChange}
          />
        ) : (
          <Skeleton className="ml-3 h-25" />
        )}
      </FilterGroup>

      <FilterGroup legend="Rede">
        {facets ? (
          NETWORKS.map((network) => (
            <FilterOption
              key={network}
              label={NETWORK_LABELS[network]}
              count={facets.networks.find(({ id }) => id === network)?.count ?? 0}
              checked={search.networks?.includes(network) ?? false}
              onChange={() => {
                selectNetwork(network)
              }}
            />
          ))
        ) : (
          <OptionsSkeleton />
        )}
      </FilterGroup>

      {countActiveFilters(search) > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onChange({
              categories: undefined,
              networks: undefined,
              minPriceEth: undefined,
              maxPriceEth: undefined,
            })
          }}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
