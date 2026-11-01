import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { queryKeys } from '@/app/query-keys'
import type { Favorites, NftSummary } from '@/contracts/nfts'
import { useSession } from '@/features/auth/hooks'
import { addFavorite, removeFavorite } from '@/features/favorites/api'
import { favoritesQueryOptions } from '@/features/favorites/queries'
import { isApiError } from '@/lib/http/api-error'
import { showToast } from '@/lib/toast'

function withFavorite(
  favorites: Favorites | undefined,
  nft: NftSummary,
  favorite: boolean,
): Favorites | undefined {
  if (!favorites) return favorites

  const others = favorites.items.filter(({ id }) => id !== nft.id)
  return { items: favorite ? [...others, nft] : others }
}

export function useFavorites() {
  const { data: session } = useSession()
  return useQuery({ ...favoritesQueryOptions, enabled: Boolean(session) })
}

export function useFavoriteToggle(nft: NftSummary) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: session } = useSession()
  const { data: isFavorite = false } = useQuery({
    ...favoritesQueryOptions,
    enabled: Boolean(session),
    select: ({ items }) => items.some(({ id }) => id === nft.id),
  })

  const { mutate, isPending } = useMutation({
    mutationKey: queryKeys.favorites,
    mutationFn: (favorite: boolean) =>
      favorite ? addFavorite(nft.id) : removeFavorite(nft.id),
    onMutate: async (favorite) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites })
      queryClient.setQueryData<Favorites>(queryKeys.favorites, (favorites) =>
        withFavorite(favorites, nft, favorite),
      )
    },
    onSuccess: (_result, favorite) => {
      showToast(
        favorite
          ? `${nft.name} adicionado aos favoritos.`
          : `${nft.name} removido dos favoritos.`,
      )
    },
    // Undoes only this NFT: a snapshot would also revert other hearts clicked meanwhile.
    onError: (error, favorite) => {
      queryClient.setQueryData<Favorites>(queryKeys.favorites, (favorites) =>
        withFavorite(favorites, nft, !favorite),
      )
      if (!isApiError(error, 'unauthorized')) {
        showToast(`Não foi possível atualizar os favoritos de ${nft.name}.`, 'error')
      }
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: queryKeys.favorites }) === 1) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.favorites })
      }
    },
  })

  function toggle() {
    if (session) {
      mutate(!isFavorite)
      return
    }
    void router.navigate({
      to: '/login',
      search: { redirect: router.state.location.href },
    })
  }

  return { isFavorite, isPending, toggle }
}
