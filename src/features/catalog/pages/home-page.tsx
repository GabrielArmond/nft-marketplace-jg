import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { FilterIcon } from '@/components/icons/icons'
import { NFT_TABS } from '@/contracts/nfts'
import { CatalogResults } from '@/features/catalog/components/catalog-results'
import { FeaturedBanner } from '@/features/catalog/components/featured-banner'
import { FilterPanel } from '@/features/catalog/components/filter-panel'
import { FiltersDialog } from '@/features/catalog/components/filters-dialog'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { HomeJournal, HomePromos } from '@/features/catalog/components/home-editorial'
import { SearchField } from '@/features/catalog/components/search-field'
import { SortSelect } from '@/features/catalog/components/sort-select'
import { nftListQueryOptions } from '@/features/catalog/queries'
import {
  countActiveFilters,
  EMPTY_CATALOG_SEARCH,
  TAB_LABELS,
  toListParams,
  type CatalogSearch,
} from '@/features/catalog/search-params'
import { cn } from '@/lib/utils'

function filtersLabel(active: number): string {
  if (active === 0) return 'Abrir filtros'
  return `Abrir filtros, ${active.toString()} ${active === 1 ? 'ativo' : 'ativos'}`
}

/** `search` defaults to empty because auth screens render this page behind their dialog. */
export function HomePage({ search = EMPTY_CATALOG_SEARCH }: { search?: CatalogSearch }) {
  const navigate = useNavigate()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = useQuery(nftListQueryOptions(toListParams(search)))
  const facets = query.data?.facets
  const activeFilters = countActiveFilters(search)

  // Any change to the result set goes back to the first page.
  const updateSearch = (changes: Partial<CatalogSearch>) => {
    void navigate({ to: '/', search: { ...search, page: undefined, ...changes }, resetScroll: false })
  }

  const updateQuery = useCallback(
    (q: string) => {
      void navigate({
        to: '/',
        // Typing replaces: Back should leave the search, not undo it letter by letter.
        replace: true,
        resetScroll: false,
        search: (previous) => ({ ...previous, page: undefined, q: q || undefined }),
      })
    },
    [navigate],
  )

  function openFilters() {
    setFiltersOpen(true)
  }

  return (
    <div className="page-container pt-10 md:pt-0">
      <div className="mb-4 flex gap-2 md:hidden">
        <SearchField value={search.q ?? ''} onChange={updateQuery} />
        <button
          type="button"
          aria-label={filtersLabel(activeFilters)}
          aria-haspopup="dialog"
          className="relative flex size-11.25 shrink-0 items-center justify-center rounded-[0.875rem] bg-linear-137 from-primary/45 to-primary text-primary-foreground"
          onClick={openFilters}
        >
          <FilterIcon className="size-5.5" />
          {activeFilters > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-tiny font-bold"
            >
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      <HomeHero />

      <section
        id="catalogo"
        aria-label="Catálogo"
        className="mt-4 scroll-mt-6 md:mt-24 xl:grid xl:grid-cols-[19.375rem_minmax(0,1fr)] xl:gap-12"
      >
        <aside className="hidden flex-col gap-6 xl:flex">
          <div className="bg-card p-5">
            <FilterPanel search={search} facets={facets} onChange={updateSearch} />
          </div>
          <FeaturedBanner />
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-4 md:mb-6">
            <nav aria-label="Listas" className="flex items-center w-full">
              <ul className="flex items-center justify-between gap-3 md:gap-5 md:justify-start w-full">
                {NFT_TABS.map((tab) => {
                  const current = (search.tab ?? 'all') === tab
                  return (
                    <li key={tab} className="shrink-0">
                      <Link
                        to="/"
                        search={{ ...search, page: undefined, tab: tab === 'all' ? undefined : tab }}
                        resetScroll={false}
                        aria-current={current ? 'page' : undefined}
                        className={cn(
                          'block border-b pb-1 text-sm leading-4 md:text-md md:leading-4 md:font-medium',
                          current
                            ? 'border-primary font-bold text-content-accent'
                            : 'border-transparent',
                        )}
                      >
                        {TAB_LABELS[tab]}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="hidden shrink-0 items-center gap-4 md:flex">
              <button
                type="button"
                aria-label={filtersLabel(activeFilters)}
                aria-haspopup="dialog"
                className="flex items-center gap-1 text-md xl:hidden"
                onClick={openFilters}
              >
                <FilterIcon className="size-5.5" />
                Filtros{activeFilters > 0 && ` (${activeFilters.toString()})`}
              </button>
              <div className="hidden lg:block">
                <SortSelect
                  value={search.sort ?? 'recent'}
                  onChange={(sort) => {
                    updateSearch({ sort: sort === 'recent' ? undefined : sort })
                  }}
                />
              </div>
            </div>
          </div>

          <CatalogResults query={query} search={search} />
        </div>
      </section>

      <HomePromos />
      <HomeJournal />

      <FiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        search={search}
        facets={facets}
        totalItems={query.data?.totalItems}
        onChange={updateSearch}
      />
    </div>
  )
}
