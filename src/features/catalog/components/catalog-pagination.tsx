import { Link } from '@tanstack/react-router'

import { ChevronRightIcon } from '@/components/icons/icons'
import type { CatalogSearch } from '@/features/catalog/search-params'
import { cn } from '@/lib/utils'

const PAGE_LINK =
  'flex size-8.75 items-center justify-center rounded-sm border border-border text-lg leading-4'
const MAX_VISIBLE_PAGES = 7

/** Keeps first, last and the neighbours of the current page. `null` marks a gap. */
function visiblePages(current: number, total: number): (number | null)[] {
  if (total <= MAX_VISIBLE_PAGES) return Array.from({ length: total }, (_, index) => index + 1)

  const near = [1, current - 1, current, current + 1, total]
  const pages = [...new Set(near)].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  return pages.flatMap((page, index) => {
    const previous = pages[index - 1]
    return previous !== undefined && page - previous > 1 ? [null, page] : [page]
  })
}

interface CatalogPaginationProps {
  search: CatalogSearch
  totalPages: number
}

export function CatalogPagination({ search, totalPages }: CatalogPaginationProps) {
  const current = search.page ?? 1
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="mt-16 flex justify-end md:mt-22">
      <ul className="flex flex-wrap gap-2">
        {visiblePages(current, totalPages).map((page, index) => (
          <li key={page ?? `gap-${index.toString()}`}>
            {page === null ? (
              <span aria-hidden="true" className="flex size-8.75 items-center justify-center">
                …
              </span>
            ) : (
              <Link
                to="/"
                hash="catalogo"
                search={{ ...search, page: page === 1 ? undefined : page }}
                aria-label={`Página ${page.toString()}`}
                aria-current={page === current ? 'page' : undefined}
                className={cn(
                  PAGE_LINK,
                  page === current &&
                    'border-primary bg-primary font-bold text-primary-foreground',
                )}
              >
                {page}
              </Link>
            )}
          </li>
        ))}
        {current < totalPages && (
          <li>
            <Link
              to="/"
              hash="catalogo"
              search={{ ...search, page: current + 1 }}
              aria-label="Próxima página"
              className={PAGE_LINK}
            >
              <ChevronRightIcon className="size-4.5" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
