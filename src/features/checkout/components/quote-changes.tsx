import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import type { Quote } from '@/contracts/cart'
import { hasStockIssue } from '@/features/checkout/quote'
import { formatEth } from '@/lib/money/eth'

interface QuoteChangesProps {
  quote: Quote
  previous: Quote | null
  onAccept: () => void
}

/** The API reports each change once: an earlier quote may already have taken the issues. */
function priceChanges(quote: Quote, previous: Quote | null): string[] {
  return quote.lines.flatMap(({ editionId, name, unitPriceEth }) => {
    const before = previous?.lines.find((line) => line.editionId === editionId)
    return before && before.unitPriceEth !== unitPriceEth
      ? [`O preço de ${name} mudou para ${formatEth(unitPriceEth)} ETH.`]
      : []
  })
}

/** Takes the focus: the buyer cannot go on, or even read the new total, without noticing. */
export function QuoteChanges({ quote, previous, onAccept }: QuoteChangesProps) {
  const box = useRef<HTMLDivElement>(null)
  const blocked = hasStockIssue(quote)
  const messages = quote.issues.length > 0 ? quote.issues.map(({ message }) => message) : priceChanges(quote, previous)

  useEffect(() => {
    box.current?.focus()
  }, [])

  return (
    <div
      ref={box}
      role="alert"
      tabIndex={-1}
      className="flex flex-col gap-2 rounded-xs border border-destructive p-3 text-sm"
    >
      <p className="font-bold">Os valores mudaram</p>
      {messages.length > 0 ? (
        <ul className="list-inside list-disc">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : (
        <p>Atualizamos o resumo com a cotação mais recente.</p>
      )}
      {previous && previous.totalEth !== quote.totalEth && (
        <p>
          Total: de {formatEth(previous.totalEth)} ETH para {formatEth(quote.totalEth)} ETH.
        </p>
      )}
      {blocked ? (
        <Button asChild variant="outline" size="sm" className="self-start text-sm">
          <Link to="/carrinho">Ajustar carrinho</Link>
        </Button>
      ) : (
        <Button type="button" size="sm" className="self-start text-sm" onClick={onAccept}>
          Aceitar novos valores
        </Button>
      )}
    </div>
  )
}
