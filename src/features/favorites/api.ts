import { favoritesSchema, type Favorites } from '@/contracts/nfts'
import { requestJson, requestVoid, type RequestOptions } from '@/lib/http/request'

export function listFavorites(options?: RequestOptions): Promise<Favorites> {
  return requestJson(favoritesSchema, { url: '/favorites', ...options })
}

export function addFavorite(nftId: string): Promise<void> {
  return requestVoid({ method: 'PUT', url: `/favorites/${encodeURIComponent(nftId)}` })
}

export function removeFavorite(nftId: string): Promise<void> {
  return requestVoid({ method: 'DELETE', url: `/favorites/${encodeURIComponent(nftId)}` })
}
