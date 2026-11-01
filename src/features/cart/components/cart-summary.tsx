import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { Cart } from '@/contracts/cart'
import { CouponForm } from '@/features/cart/components/coupon-form'
import { formatEth } from '@/lib/money/eth'
import { cn } from '@/lib/utils'

function Row({
  label,
  small = false,
  children,
}: {
  label: string
  small?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-md">{label}</dt>
      <dd className={cn('whitespace-nowrap', small ? 'text-md' : 'text-base md:text-lg')}>
        {children}
      </dd>
    </div>
  )
}

export function CartSummary({ cart }: { cart: Cart }) {
  const { summary, couponCode, items } = cart
  const blocked = items.some(({ quantity, available }) => quantity > available)

  return (
    <aside
      aria-labelledby="resumo-titulo"
      className="mt-6 flex flex-col gap-3 bg-card px-6 pt-6 pb-9 md:bg-transparent md:p-0 xl:mt-0 xl:gap-6"
    >
      <h2
        id="resumo-titulo"
        className="sr-only md:not-sr-only md:border-b md:border-primary/30 md:pb-3 md:text-lg md:leading-4 md:font-bold"
      >
        Resumo da carteira
      </h2>

      <CouponForm appliedCode={couponCode} />

      <dl className="flex flex-col gap-3">
        <Row label="Subtotal">{formatEth(summary.subtotalEth)} ETH</Row>
        <Row small label="Desconto do lançamento">
          (-) {formatEth(summary.discountEth)} ETH
        </Row>
        <div>
          <Row label="Taxa de rede">{formatEth(summary.networkFeeEth)} ETH</Row>
          <p className="text-right text-xs text-content-accent">Taxa estimada</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-base leading-4 font-bold">Total</dt>
          <dd className="text-lg leading-4 font-bold text-content-accent">
            {formatEth(summary.totalEth)} ETH
          </dd>
        </div>
      </dl>

      <div className="mt-2 flex flex-col items-center gap-3">
        {blocked ? (
          <Button disabled variant="gradient" size="cta" className="w-full md:h-10 md:rounded-xs">
            Ajuste os itens para continuar
          </Button>
        ) : (
          <Button
            asChild
            variant="gradient"
            size="cta"
            className="w-full md:h-10 md:rounded-xs md:bg-primary md:bg-none"
          >
            <Link to="/pagamento">Conectar e finalizar</Link>
          </Button>
        )}
        <Link to="/" hash="catalogo" className="text-md text-content-accent">
          Continuar explorando
        </Link>
      </div>
    </aside>
  )
}
