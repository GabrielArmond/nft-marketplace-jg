import { createFileRoute } from '@tanstack/react-router'

import { nftListQueryOptions } from '@/features/catalog/queries'
import { toListParams, validateCatalogSearch } from '@/features/catalog/search-params'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    // Begin the catalog request during route matching, before HomePage mounts.
    void context.queryClient
      .query(nftListQueryOptions(toListParams(deps.search)))
      .catch(() => undefined)
  },
})
