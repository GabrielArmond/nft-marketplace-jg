import * as z from 'zod/mini'

import {
  ethAmountSchema,
  imageSchema,
  isoDateTimeSchema,
  networkSchema,
  pageSchema,
} from '@/contracts/common'

export const NFT_CATEGORIES = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'subscriptions',
  'utility',
] as const
export const nftCategorySchema = z.enum(NFT_CATEGORIES)
export type NftCategory = z.infer<typeof nftCategorySchema>

export const NFT_TABS = ['all', 'new', 'trending'] as const
export const nftTabSchema = z.enum(NFT_TABS)
export type NftTab = z.infer<typeof nftTabSchema>

export const NFT_SORTS = ['recent', 'price_asc', 'price_desc', 'name_asc'] as const
export const nftSortSchema = z.enum(NFT_SORTS)
export type NftSort = z.infer<typeof nftSortSchema>

export const editionSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Total copies; `null` for an open edition. */
  supply: z.nullable(z.int()),
  available: z.int().check(z.gte(0)),
  priceEth: ethAmountSchema,
})
export type Edition = z.infer<typeof editionSchema>

export const nftSummarySchema = z.object({
  id: z.string(),
  tokenId: z.string(),
  name: z.string(),
  category: nftCategorySchema,
  collection: z.string(),
  network: networkSchema,
  image: imageSchema,
  /** Price of the default edition. */
  priceEth: ethAmountSchema,
  compareAtPriceEth: z.nullable(ethAmountSchema),
  isRare: z.boolean(),
  soldOut: z.boolean(),
  listedAt: isoDateTimeSchema,
  /** Grows on every change; realtime events carry the same number. */
  version: z.int().check(z.gte(1)),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftDetailSchema = z.extend(nftSummarySchema, {
  description: z.string(),
  attributes: z.array(z.string()),
  gallery: z.array(imageSchema),
  defaultEditionId: z.string(),
  editions: z.array(editionSchema),
  contractAddress: z.string(),
  royaltyPercent: z.number(),
  rating: z.number(),
  reviewCount: z.int(),
})
export type NftDetail = z.infer<typeof nftDetailSchema>

const facetSchema = z.object({ count: z.int(), id: z.string() })

export const nftFacetsSchema = z.object({
  categories: z.array(facetSchema),
  networks: z.array(facetSchema),
  priceRange: z.object({ minEth: ethAmountSchema, maxEth: ethAmountSchema }),
})
export type NftFacets = z.infer<typeof nftFacetsSchema>

export const nftListSchema = z.extend(pageSchema(nftSummarySchema), { facets: nftFacetsSchema })
export type NftList = z.infer<typeof nftListSchema>

/** Query string of `GET /nfts`. Lists are sent comma-separated. */
export interface NftListParams {
  q?: string
  categories?: readonly NftCategory[]
  networks?: readonly z.infer<typeof networkSchema>[]
  minPriceEth?: string
  maxPriceEth?: string
  tab?: NftTab
  sort?: NftSort
  page?: number
  pageSize?: number
}

export const favoritesSchema = z.object({ items: z.array(nftSummarySchema) })
export type Favorites = z.infer<typeof favoritesSchema>
