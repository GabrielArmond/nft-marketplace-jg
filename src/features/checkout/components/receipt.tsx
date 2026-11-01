import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

import { Button } from '@/components/ui/button'
import type { Receipt as ReceiptData } from '@/contracts/orders'
import { NETWORK_LABELS } from '@/features/catalog/search-params'
import { OrderLines } from '@/features/checkout/components/order-lines'
import { formatEth } from '@/lib/money/eth'

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function shortHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

/** Everything comes from the receipt: the catalog can change without touching this page. */
export function Receipt({ receipt }: { receipt: ReceiptData }) {
  const { orderNumber, network, lines, walletLabel, transactionHash, explorerUrl } = receipt
  const { confirmedAt, discountEth, networkFeeEth, totalEth } = receipt
  const meta = [
    { label: 'ID da transação', value: shortHash(transactionHash) },
    { label: 'Data', value: DATE_FORMAT.format(new Date(confirmedAt)) },
    { label: 'Total', value: `${formatEth(totalEth)} ETH` },
    { label: 'Carteira', value: walletLabel },
  ]

  return (
    <article className="relative mx-auto my-6 w-full max-w-144.5 border-b-10 border-primary bg-card md:my-10">
      <header className="flex flex-col items-center gap-4 border-b border-primary px-6 py-6 text-center">
        <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" className="size-20 text-primary">
          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" />
          <path
            d="m24 41 11 11 21-23"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1 className="text-base leading-5 font-bold text-content-secondary">
          Seus NFTs agora estão na sua carteira
        </h1>
        <p className="text-sm text-content-secondary">Pedido {orderNumber}</p>
      </header>

      <dl className="grid grid-cols-2 gap-3 border-b border-primary px-6 py-3 text-content-secondary md:flex md:justify-between">
        {meta.map(({ label, value }, index) => (
          <Fragment key={label}>
            {index > 0 && (
              <span aria-hidden="true" className="hidden w-px self-stretch bg-primary md:block" />
            )}
            <div className="min-w-0">
              <dt className="text-sm leading-4 font-bold">{label}</dt>
              <dd className="text-md leading-5">{value}</dd>
            </div>
          </Fragment>
        ))}
      </dl>

      <section aria-labelledby="detalhes-transacao" className="flex flex-col gap-3 p-6 md:px-11">
        <h2 id="detalhes-transacao" className="text-md leading-4 font-bold">
          Detalhes da transação
        </h2>
        <OrderLines lines={lines} />
        <dl className="flex flex-col gap-3 self-end md:w-80">
          {discountEth !== '0' && (
            <div className="flex justify-between gap-6">
              <dt className="text-md">Desconto do Cupom</dt>
              <dd className="text-md">(-) {formatEth(discountEth)} ETH</dd>
            </div>
          )}
          <div className="flex justify-between gap-6">
            <dt className="text-md">Taxa de rede</dt>
            <dd className="text-md">{formatEth(networkFeeEth)} ETH</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-base font-bold">Total</dt>
            <dd className="text-lg leading-6 font-bold text-content-accent">
              {formatEth(totalEth)} ETH
            </dd>
          </div>
        </dl>
        <hr className="border-primary" />
        <p className="text-sm text-content-secondary">
          Transação simulada confirmada na {NETWORK_LABELS[network]}.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Button asChild size="lg">
            <a href={explorerUrl} target="_blank" rel="noreferrer">
              Ver no explorador (simulado)
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/" hash="catalogo">
              Voltar ao catálogo
            </Link>
          </Button>
        </div>
      </section>
    </article>
  )
}
