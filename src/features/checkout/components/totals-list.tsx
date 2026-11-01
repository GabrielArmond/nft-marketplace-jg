import type { ReactNode } from 'react'

import type { SummaryTotals } from '@/contracts/cart'
import { formatEth } from '@/lib/money/eth'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-md">{label}</dt>
      <dd className="text-base whitespace-nowrap md:text-lg">{children}</dd>
    </div>
  )
}

export function TotalsList({ totals }: { totals: SummaryTotals }) {
  const { subtotalEth, discountEth, networkFeeEth, totalEth } = totals

  return (
    <dl className="flex flex-col gap-3">
      <Row label="Subtotal">{formatEth(subtotalEth)} ETH</Row>
      <Row label="Desconto do Cupom">(-) {formatEth(discountEth)} ETH</Row>
      <Row label="Taxa de rede">{formatEth(networkFeeEth)} ETH</Row>
      <div className="flex items-center justify-between gap-3 border-t border-primary pt-3">
        <dt className="text-base leading-4 font-bold">Total</dt>
        <dd className="text-lg leading-4 font-bold text-content-accent">
          {formatEth(totalEth)} ETH
        </dd>
      </div>
    </dl>
  )
}
