import { HttpResponse } from 'msw'

import { getDb } from '@/mocks/db/store'
import { requireUser } from '@/mocks/domain/auth'
import { findNft, listCatalog, toDetail, toSummary } from '@/mocks/domain/catalog'
import { noContent, param, route } from '@/mocks/handlers/route'

export const catalogHandlers = [
  route('get', '/nfts', ({ url }) => HttpResponse.json(listCatalog(url.searchParams))),

  route('get', '/nfts/:id', (context) =>
    HttpResponse.json(toDetail(findNft(param(context, 'id')))),
  ),

  route('get', '/favorites', () => {
    const { id } = requireUser()
    const ids = getDb().favorites[id] ?? []
    return HttpResponse.json({ items: ids.map(findNft).map(toSummary) })
  }),

  route('put', '/favorites/:nftId', (context) => {
    const { id } = requireUser()
    const nft = findNft(param(context, 'nftId'))
    const { favorites } = getDb()
    const current = favorites[id] ?? []

    favorites[id] = current.includes(nft.id) ? current : [...current, nft.id]
    return noContent()
  }),

  route('delete', '/favorites/:nftId', (context) => {
    const { id } = requireUser()
    const nftId = param(context, 'nftId')
    const { favorites } = getDb()

    favorites[id] = (favorites[id] ?? []).filter((favorite) => favorite !== nftId)
    return noContent()
  }),
]
