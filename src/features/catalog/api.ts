import {
  nftDetailSchema,
  nftListSchema,
  type NftDetail,
  type NftList,
  type NftListParams,
} from '@/contracts/nfts'
import { requestJson, type RequestOptions } from '@/lib/http/request'

function toQueryParams({ categories, networks, ...rest }: NftListParams) {
  return {
    ...rest,
    categories: categories?.length ? categories.join(',') : undefined,
    networks: networks?.length ? networks.join(',') : undefined,
  }
}

export function listNfts(params: NftListParams = {}, options?: RequestOptions): Promise<NftList> {
  return requestJson(nftListSchema, { url: '/nfts', params: toQueryParams(params), ...options })
}

export function getNft(id: string, options?: RequestOptions): Promise<NftDetail> {
  return requestJson(nftDetailSchema, { url: `/nfts/${encodeURIComponent(id)}`, ...options })
}
