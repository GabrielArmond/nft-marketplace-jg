import type { Edition, NftDetail } from '@/contracts/nfts'

export interface Selection {
  editionId: string
  quantity: number
}

interface Reconciled {
  selection: Selection
  notice: string | null
}

function firstAvailable(nft: NftDetail): Edition | undefined {
  return nft.editions.find(({ available }) => available > 0)
}

export function initialSelection(nft: NftDetail): Selection {
  const preferred = nft.editions.find(({ id }) => id === nft.defaultEditionId)
  const edition = preferred?.available ? preferred : (firstAvailable(nft) ?? preferred)

  return { editionId: edition?.id ?? nft.defaultEditionId, quantity: 1 }
}

/** How many more copies can go to the cart. */
export function remainingFor(edition: Edition, inCart: number): number {
  return Math.max(edition.available - inCart, 0)
}

/**
 * Checks a selection against fresh data. Stock changes while the screen is open,
 * so a choice can stop being valid: it is corrected and the reason is reported.
 * Returns the same `selection` object when nothing had to change.
 */
export function reconcileSelection(
  nft: NftDetail,
  selection: Selection,
  inCart: number,
): Reconciled {
  const edition = nft.editions.find(({ id }) => id === selection.editionId)

  if (!edition || edition.available === 0) {
    const next = firstAvailable(nft)
    if (!next) return { selection, notice: null }

    return {
      selection: { editionId: next.id, quantity: 1 },
      notice: `A edição ${edition?.label ?? 'escolhida'} esgotou. Selecionamos a edição ${next.label}.`,
    }
  }

  const limit = Math.max(remainingFor(edition, inCart), 1)
  if (selection.quantity <= limit) return { selection, notice: null }

  // Nothing left to add: the panel already says everything is in the cart.
  if (remainingFor(edition, inCart) === 0) {
    return { selection: { ...selection, quantity: 1 }, notice: null }
  }

  return {
    selection: { ...selection, quantity: limit },
    notice: `Restam ${limit.toString()} unidades da edição ${edition.label}. Ajustamos a quantidade.`,
  }
}
