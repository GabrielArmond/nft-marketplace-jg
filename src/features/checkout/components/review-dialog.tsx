import { Dialog } from 'radix-ui'
import type { RefObject } from 'react'

import { CloseIcon } from '@/components/icons/icons'
import { Button } from '@/components/ui/button'
import type { Wallet } from '@/contracts/account'
import type { Quote } from '@/contracts/cart'
import type { Collector } from '@/contracts/orders'
import { NETWORK_LABELS } from '@/features/catalog/search-params'
import { OrderLines } from '@/features/checkout/components/order-lines'
import { TotalsList } from '@/features/checkout/components/totals-list'

interface ReviewDialogProps {
  quote: Quote
  wallet: Wallet
  collector: Collector
  sending: boolean
  returnFocusTo: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onConfirm: () => void
}

export function ReviewDialog({
  quote,
  wallet,
  collector,
  sending,
  returnFocusTo,
  onClose,
  onConfirm,
}: ReviewDialogProps) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !sending) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            // No Dialog.Trigger here: Radix would drop the focus on the body.
            event.preventDefault()
            returnFocusTo.current?.focus()
          }}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-4 overflow-y-auto rounded-t-3xl border-t-10 border-primary bg-background p-6 md:inset-auto md:top-1/2 md:left-1/2 md:w-144.5 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-none md:border-t-0 md:border-b-10"
        >
          <Dialog.Title className="text-lg leading-4 font-bold">Revise sua compra</Dialog.Title>
          <Dialog.Close
            aria-label="Fechar revisão"
            className="absolute top-4 right-4 flex size-8 items-center justify-center text-primary"
          >
            <CloseIcon className="size-4.5" />
          </Dialog.Close>

          <OrderLines lines={quote.lines} />
          <TotalsList totals={quote} />

          <dl className="grid gap-1 text-sm text-content-secondary">
            <div className="flex justify-between gap-3">
              <dt>Carteira</dt>
              <dd className="truncate">{wallet.label}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Rede</dt>
              <dd>{NETWORK_LABELS[quote.network]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Colecionador</dt>
              <dd className="truncate">{collector.displayName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>E-mail</dt>
              <dd className="truncate">{collector.email}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 md:flex-row-reverse">
            <Button
              type="button"
              size="lg"
              disabled={sending}
              className="md:flex-1"
              onClick={onConfirm}
            >
              {sending ? 'Enviando...' : 'Confirmar pagamento'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={sending}
              className="md:flex-1"
              onClick={onClose}
            >
              Voltar e editar
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
