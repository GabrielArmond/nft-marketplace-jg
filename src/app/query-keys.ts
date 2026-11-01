import type { Network } from '@/contracts/common'
import type { NftListParams } from '@/contracts/nfts'

/** Everything under this scope belongs to one user and is dropped when the session changes. */
export const PRIVATE_SCOPE = 'private'

export const queryKeys = {
  session: ['session'],
  cart: [PRIVATE_SCOPE, 'cart'],
  favorites: [PRIVATE_SCOPE, 'favorites'],
  profile: [PRIVATE_SCOPE, 'profile'],
  wallets: [PRIVATE_SCOPE, 'wallets'],
  orders: [PRIVATE_SCOPE, 'orders'],
  orderList: [PRIVATE_SCOPE, 'orders', 'list'],
  order: (id: string) => [PRIVATE_SCOPE, 'orders', 'detail', id] as const,
  /** One quote per network and cart state: a changed cart asks the API again. */
  quote: (network: Network, cartSignature: string) =>
    [PRIVATE_SCOPE, 'quote', network, cartSignature] as const,
  nfts: ['nfts'],
  nftLists: ['nfts', 'list'],
  /** Holds exactly what is sent to the API: one cache entry per distinct request. */
  nftList: (params: NftListParams) => ['nfts', 'list', params] as const,
  nftDetail: (id: string) => ['nfts', 'detail', id] as const,
  nftDetails: ['nfts', 'detail'],
} as const
