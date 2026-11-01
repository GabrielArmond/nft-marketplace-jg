import { API_ERROR_CODES, NETWORKS, type Network } from '@/contracts/common'
import {
  NFT_CATEGORIES,
  NFT_SORTS,
  NFT_TABS,
  type Edition,
  type NftCategory,
  type NftFacets,
  type NftList,
  type NftSort,
  type NftSummary,
  type NftTab,
} from '@/contracts/nfts'
import { applyBasisPoints, compareEth, isEthAmount } from '@/lib/money/eth'
import { getDb } from '@/mocks/db/store'
import type { NftRecord } from '@/mocks/db/types'
import { invalidFields, MockHttpError, notFound } from '@/mocks/domain/errors'
import { publishNftUpdated } from '@/mocks/domain/events'
import { resolveScenario } from '@/mocks/engine/scenarios'

const DEFAULT_PAGE_SIZE = 9
const MAX_PAGE_SIZE = 48
const NEW_LISTING_FROM = '2026-08-15T00:00:00.000Z'

export function toSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    category: nft.category,
    collection: nft.collection,
    network: nft.network,
    image: nft.image,
    priceEth: nft.priceEth,
    compareAtPriceEth: nft.compareAtPriceEth,
    isRare: nft.isRare,
    soldOut: nft.soldOut,
    listedAt: nft.listedAt,
    version: nft.version,
  }
}

export function toDetail(nft: NftRecord) {
  const { trendingScore: _internal, ...detail } = nft
  return detail
}

export function findNft(id: string): NftRecord {
  const nft = getDb().nfts.find((item) => item.id === id)
  if (!nft) throw notFound('NFT inexistente.')
  return nft
}

export function findEdition(nft: NftRecord, editionId: string): Edition {
  const edition = nft.editions.find(({ id }) => id === editionId)
  if (!edition) throw notFound('Edição inexistente.')
  return edition
}

/** Single path of every catalog change: REST and events can never disagree. */
export function touchNft(nft: NftRecord): void {
  const defaultEdition = findEdition(nft, nft.defaultEditionId)

  nft.priceEth = defaultEdition.priceEth
  nft.soldOut = nft.editions.every(({ available }) => available === 0)
  nft.version += 1
  publishNftUpdated(nft)
}

export function updateEdition(
  nftId: string,
  editionId: string,
  changes: { priceEth?: string; available?: number },
): NftRecord {
  const nft = findNft(nftId)
  const edition = findEdition(nft, editionId)

  if (changes.priceEth !== undefined) edition.priceEth = changes.priceEth
  if (changes.available !== undefined) edition.available = changes.available
  touchNft(nft)
  return nft
}

export function raiseEditionPrice(nftId: string, editionId: string): void {
  const edition = findEdition(findNft(nftId), editionId)
  updateEdition(nftId, editionId, { priceEth: applyBasisPoints(edition.priceEth, 11_000) })
}

function includes<Value extends string>(allowed: readonly Value[], value: string): value is Value {
  return (allowed as readonly string[]).includes(value)
}

function parseList<Value extends string>(
  field: string,
  raw: string | null,
  allowed: readonly Value[],
): Value[] {
  if (!raw) return []

  const values = raw.split(',')
  const valid = values.filter((value) => includes(allowed, value))
  if (valid.length !== values.length) throw invalidFields({ [field]: ['Valor inválido.'] })
  return valid
}

function parseEnum<Value extends string>(
  field: string,
  raw: string | null,
  allowed: readonly Value[],
  fallback: Value,
): Value {
  if (raw === null) return fallback
  if (!includes(allowed, raw)) throw invalidFields({ [field]: ['Valor inválido.'] })
  return raw
}

function parsePrice(field: string, raw: string | null): string | null {
  if (raw === null) return null
  if (!isEthAmount(raw)) throw invalidFields({ [field]: ['Informe um valor em ETH.'] })
  return raw
}

function parsePositiveInt(field: string, raw: string | null, fallback: number): number {
  if (raw === null) return fallback

  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1) {
    throw invalidFields({ [field]: ['Informe um inteiro positivo.'] })
  }
  return value
}

interface CatalogQuery {
  q: string
  categories: NftCategory[]
  networks: Network[]
  minPriceEth: string | null
  maxPriceEth: string | null
  tab: NftTab
  sort: NftSort
  page: number
  pageSize: number
}

function parseQuery(params: URLSearchParams): CatalogQuery {
  const query: CatalogQuery = {
    q: params.get('q')?.trim().toLowerCase() ?? '',
    categories: parseList('categories', params.get('categories'), NFT_CATEGORIES),
    networks: parseList('networks', params.get('networks'), NETWORKS),
    minPriceEth: parsePrice('minPriceEth', params.get('minPriceEth')),
    maxPriceEth: parsePrice('maxPriceEth', params.get('maxPriceEth')),
    tab: parseEnum('tab', params.get('tab'), NFT_TABS, 'all'),
    sort: parseEnum('sort', params.get('sort'), NFT_SORTS, 'recent'),
    page: parsePositiveInt('page', params.get('page'), 1),
    pageSize: Math.min(
      parsePositiveInt('pageSize', params.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    ),
  }

  const { minPriceEth, maxPriceEth } = query
  if (minPriceEth && maxPriceEth && compareEth(minPriceEth, maxPriceEth) > 0) {
    throw new MockHttpError(422, API_ERROR_CODES.validationFailed, 'Faixa de preço inválida.', {
      minPriceEth: ['O mínimo não pode superar o máximo.'],
    })
  }
  return query
}

function matchesText(nft: NftRecord, q: string): boolean {
  return !q || `${nft.name} ${nft.tokenId} ${nft.collection}`.toLowerCase().includes(q)
}

function matchesTab(nft: NftRecord, tab: NftTab): boolean {
  return tab !== 'new' || nft.listedAt >= NEW_LISTING_FROM
}

function matchesPrice(nft: NftRecord, query: CatalogQuery): boolean {
  const { minPriceEth, maxPriceEth } = query
  if (minPriceEth && compareEth(nft.priceEth, minPriceEth) < 0) return false
  return !maxPriceEth || compareEth(nft.priceEth, maxPriceEth) <= 0
}

function sortNfts(items: NftRecord[], sort: NftSort, tab: NftTab): NftRecord[] {
  const byId = (a: NftRecord, b: NftRecord) => a.id.localeCompare(b.id)

  return items.toSorted((a, b) => {
    if (tab === 'trending' && sort === 'recent') {
      return b.trendingScore - a.trendingScore || byId(a, b)
    }
    switch (sort) {
      case 'price_asc':
        return compareEth(a.priceEth, b.priceEth) || byId(a, b)
      case 'price_desc':
        return compareEth(b.priceEth, a.priceEth) || byId(a, b)
      case 'name_asc':
        return a.name.localeCompare(b.name, 'pt-BR') || byId(a, b)
      case 'recent':
        return b.listedAt.localeCompare(a.listedAt) || byId(a, b)
    }
  })
}

function countBy(items: readonly NftRecord[], read: (nft: NftRecord) => string) {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(read(item), (counts.get(read(item)) ?? 0) + 1)
  return counts
}

/** Each facet counts what the other active filters leave, so options stay truthful. */
function buildFacets(items: readonly NftRecord[], query: CatalogQuery): NftFacets {
  const base = items.filter((nft) => matchesPrice(nft, query))
  const categories = countBy(
    base.filter((nft) => !query.networks.length || query.networks.includes(nft.network)),
    (nft) => nft.category,
  )
  const networks = countBy(
    base.filter((nft) => !query.categories.length || query.categories.includes(nft.category)),
    (nft) => nft.network,
  )
  const prices = items.map(({ priceEth }) => priceEth).toSorted(compareEth)

  return {
    categories: NFT_CATEGORIES.map((id) => ({ id, count: categories.get(id) ?? 0 })),
    networks: NETWORKS.map((id) => ({ id, count: networks.get(id) ?? 0 })),
    priceRange: { minEth: prices.at(0) ?? '0', maxEth: prices.at(-1) ?? '0' },
  }
}

export function listCatalog(params: URLSearchParams): NftList {
  const query = parseQuery(params)
  const { emptyCatalog } = resolveScenario(getDb().runtime.scenarioId).flags
  const scoped = emptyCatalog
    ? []
    : getDb().nfts.filter((nft) => matchesText(nft, query.q) && matchesTab(nft, query.tab))

  const filtered = scoped.filter(
    (nft) =>
      matchesPrice(nft, query) &&
      (!query.categories.length || query.categories.includes(nft.category)) &&
      (!query.networks.length || query.networks.includes(nft.network)),
  )
  const sorted = sortNfts(filtered, query.sort, query.tab)
  const start = (query.page - 1) * query.pageSize

  return {
    items: sorted.slice(start, start + query.pageSize).map(toSummary),
    page: query.page,
    pageSize: query.pageSize,
    totalItems: sorted.length,
    totalPages: Math.ceil(sorted.length / query.pageSize),
    facets: buildFacets(scoped, query),
  }
}
