import { NETWORKS, type Network } from '@/contracts/common'
import {
  NFT_CATEGORIES,
  NFT_SORTS,
  NFT_TABS,
  type NftCategory,
  type NftListParams,
  type NftSort,
  type NftTab,
} from '@/contracts/nfts'
import { compareEth, isEthAmount } from '@/lib/money/eth'

const MAX_QUERY_LENGTH = 80

/** Catalog state held in the URL. Defaults stay out of it, so shared links are short. */
export interface CatalogSearch {
  q?: string | undefined
  categories?: NftCategory[] | undefined
  networks?: Network[] | undefined
  minPriceEth?: string | undefined
  maxPriceEth?: string | undefined
  tab?: NftTab | undefined
  sort?: NftSort | undefined
  page?: number | undefined
}

export const EMPTY_CATALOG_SEARCH: CatalogSearch = {}

function parseList<Value extends string>(
  raw: unknown,
  allowed: readonly Value[],
): Value[] | undefined {
  const values: unknown[] = Array.isArray(raw) ? raw : []
  // Allowed order, not click order: the same filters always produce the same query key.
  const selected = allowed.filter((value) => values.includes(value))
  return selected.length > 0 ? selected : undefined
}

function parseOption<Value extends string>(
  raw: unknown,
  allowed: readonly Value[],
  fallback: Value,
): Value | undefined {
  const value = allowed.find((option) => option === raw)
  return value === fallback ? undefined : value
}

function parsePrice(raw: unknown): string | undefined {
  // The router turns "1.5" in the URL into a number before this runs.
  const value = typeof raw === 'number' ? raw.toString() : raw
  return typeof value === 'string' && isEthAmount(value) ? value : undefined
}

function parseText(raw: unknown): string | undefined {
  // Same conversion: searching for "042" must not become the number 42.
  const value = typeof raw === 'number' ? raw.toString() : raw
  if (typeof value !== 'string') return undefined

  return value.trim().slice(0, MAX_QUERY_LENGTH) || undefined
}

function parsePage(raw: unknown): number | undefined {
  return typeof raw === 'number' && Number.isInteger(raw) && raw > 1 ? raw : undefined
}

/**
 * Every key is returned, even when empty: the router merges this result over the
 * raw query string, so omitting an invalid value would let it through.
 */
export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const minPriceEth = parsePrice(search.minPriceEth)
  const maxPriceEth = parsePrice(search.maxPriceEth)
  const invertedRange =
    minPriceEth !== undefined &&
    maxPriceEth !== undefined &&
    compareEth(minPriceEth, maxPriceEth) > 0

  return {
    q: parseText(search.q),
    categories: parseList(search.categories, NFT_CATEGORIES),
    networks: parseList(search.networks, NETWORKS),
    minPriceEth: invertedRange ? undefined : minPriceEth,
    maxPriceEth: invertedRange ? undefined : maxPriceEth,
    tab: parseOption(search.tab, NFT_TABS, 'all'),
    sort: parseOption(search.sort, NFT_SORTS, 'recent'),
    page: parsePage(search.page),
  }
}

/** The request for this URL state. It is also the query key, so the two cannot drift. */
export function toListParams({
  q,
  categories,
  networks,
  minPriceEth,
  maxPriceEth,
  tab,
  sort,
  page,
}: CatalogSearch): NftListParams {
  return {
    ...(q && { q }),
    ...(categories && { categories }),
    ...(networks && { networks }),
    ...(minPriceEth && { minPriceEth }),
    ...(maxPriceEth && { maxPriceEth }),
    ...(tab && { tab }),
    ...(sort && { sort }),
    ...(page && { page }),
  }
}

export function countActiveFilters({
  categories,
  networks,
  minPriceEth,
  maxPriceEth,
}: CatalogSearch): number {
  const hasPrice = minPriceEth !== undefined || maxPriceEth !== undefined
  return (categories?.length ?? 0) + (networks?.length ?? 0) + (hasPrice ? 1 : 0)
}

export const CATEGORY_LABELS: Record<NftCategory, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  subscriptions: 'Assinaturas',
  utility: 'Utilidade',
}

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const SORT_LABELS: Record<NftSort, string> = {
  recent: 'Listados recentemente',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
  name_asc: 'Nome (A-Z)',
}

export const TAB_LABELS: Record<NftTab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}
