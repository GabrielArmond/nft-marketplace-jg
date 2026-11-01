import type { NftListParams } from '@/contracts/nfts'

/** Everything under this scope belongs to one user and is dropped when the session changes. */
export const PRIVATE_SCOPE = 'private'

export const queryKeys = {
  session: ['session'],
  cart: [PRIVATE_SCOPE, 'cart'],
  favorites: [PRIVATE_SCOPE, 'favorites'],
  nfts: ['nfts'],
  nftLists: ['nfts', 'list'],
  /** Holds exactly what is sent to the API: one cache entry per distinct request. */
  nftList: (params: NftListParams) => ['nfts', 'list', params] as const,
  nftDetail: (id: string) => ['nfts', 'detail', id] as const,
  nftDetails: ['nfts', 'detail'],
} as const
