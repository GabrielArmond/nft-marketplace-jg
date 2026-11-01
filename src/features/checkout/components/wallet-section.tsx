import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import type { Wallet } from '@/contracts/account'
import { useConnectWallet, useDisconnectWallet } from '@/features/account/hooks'
import { NETWORK_LABELS } from '@/features/catalog/search-params'
import { WALLET_TYPE_LABELS } from '@/features/checkout/forms'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'
import { cn } from '@/lib/utils'

const ERROR_ID = 'carteira-erro'

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

interface WalletOptionProps {
  wallet: Wallet
  selected: boolean
  invalid: boolean
  onSelect: () => void
  radioProps: ComponentProps<'input'>
}

function WalletOption({ wallet, selected, invalid, onSelect, radioProps }: WalletOptionProps) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const { id, label, type, network, address, ensName, connected } = wallet
  const busy = connect.isPending || disconnect.isPending
  const failure = connect.error ?? disconnect.error

  return (
    <li
      className={cn(
        'rounded-[0.875rem] border bg-card p-3 md:rounded-xs md:bg-transparent',
        selected ? 'border-primary' : 'border-border',
      )}
    >
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input
            {...radioProps}
            type="radio"
            value={id}
            checked={selected}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={invalid ? ERROR_ID : undefined}
            className="size-4 shrink-0 accent-primary"
            onChange={onSelect}
          />
          <span className="min-w-0">
            <span className="block truncate text-base leading-5 font-bold">{label}</span>
            <span className="block truncate text-sm text-content-secondary">
              {WALLET_TYPE_LABELS[type]} • {NETWORK_LABELS[network]}
            </span>
            <span className="block truncate text-sm text-content-secondary">
              {ensName || shortAddress(address)}
            </span>
          </span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          aria-label={`${connected ? 'Desconectar' : 'Conectar'} ${label}`}
          className="text-sm"
          onClick={() => {
            connect.reset()
            disconnect.reset()
            if (connected) disconnect.mutate(id)
            else connect.mutate(id)
          }}
        >
          {connected ? 'Desconectar' : 'Conectar'}
        </Button>
      </div>
      <p role="status" className="mt-1 text-xs text-content-accent empty:hidden">
        {connected ? 'Conectada' : null}
      </p>
      {failure && !isApiError(failure, 'unauthorized') && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {normalizeApiError(failure).message}
        </p>
      )}
    </li>
  )
}

interface WalletSectionProps {
  wallets: readonly Wallet[]
  selectedId: string
  error: string | undefined
  onSelect: (wallet: Wallet) => void
  radioProps: ComponentProps<'input'>
}

export function WalletSection({
  wallets,
  selectedId,
  error,
  onSelect,
  radioProps,
}: WalletSectionProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-3 text-base leading-4 font-bold md:text-lg md:leading-4">
        Carteira e rede
      </legend>
      <ul className="flex flex-col gap-3">
        {wallets.map((wallet) => (
          <WalletOption
            key={wallet.id}
            wallet={wallet}
            selected={wallet.id === selectedId}
            invalid={Boolean(error)}
            radioProps={radioProps}
            onSelect={() => {
              onSelect(wallet)
            }}
          />
        ))}
      </ul>
      {error && (
        <p id={ERROR_ID} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
