import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { Wallet, WalletRole } from '@/contracts/account'
import { AccountError } from '@/features/account/components/account-error'
import { AccountLayout } from '@/features/account/components/account-layout'
import { AccountSkeleton } from '@/features/account/components/account-skeleton'
import { WalletForm } from '@/features/account/components/wallet-form'
import {
  useConnectWallet,
  useDisconnectWallet,
  useSetPrimaryWallet,
} from '@/features/account/hooks'
import { walletsQueryOptions } from '@/features/account/queries'
import { useSession } from '@/features/auth/hooks'
import { NETWORK_LABELS } from '@/features/catalog/search-params'
import { WALLET_TYPE_LABELS } from '@/features/checkout/forms'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'

const TITLES: Record<WalletRole, string> = {
  primary: 'Carteira principal',
  secondary: 'Carteira secundária',
}

function WalletSummary({ wallet, onNotice }: { wallet: Wallet; onNotice: (text: string) => void }) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const setPrimary = useSetPrimaryWallet()
  const { id, label, type, network, address, ensName, connected, role } = wallet
  const busy = connect.isPending || disconnect.isPending || setPrimary.isPending
  const failure = connect.error ?? disconnect.error ?? setPrimary.error

  return (
    <div className="flex flex-col gap-3 rounded-[0.875rem] border border-border bg-card p-4 md:rounded-xs">
      <div className="min-w-0 text-sm text-content-secondary">
        <p className="text-base leading-5 font-bold text-foreground">{label}</p>
        <p>
          {WALLET_TYPE_LABELS[type]} • {NETWORK_LABELS[network]}
        </p>
        <p className="break-all">{address}</p>
        {ensName && <p className="break-all">{ensName}</p>}
        <p className="mt-1 text-xs text-content-accent">
          {connected ? 'Conectada' : 'Desconectada'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          aria-label={`${connected ? 'Desconectar' : 'Conectar'} ${label}`}
          className="text-sm"
          onClick={() => {
            if (connected) disconnect.mutate(id)
            else connect.mutate(id)
          }}
        >
          {connected ? 'Desconectar' : 'Conectar'}
        </Button>
        {role === 'secondary' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className="text-sm"
            onClick={() => {
              setPrimary.mutate(id, {
                onSuccess: () => {
                  onNotice(`${label} agora é a carteira principal.`)
                },
              })
            }}
          >
            Definir como principal
          </Button>
        )}
      </div>
      {failure && !isApiError(failure, 'unauthorized') && (
        <p role="alert" className="text-xs text-destructive">
          {normalizeApiError(failure).message}
        </p>
      )}
    </div>
  )
}

interface WalletSectionProps {
  userId: string
  role: WalletRole
  wallet: Wallet | undefined
  primary: Wallet | undefined
  onNotice: (text: string) => void
}

function WalletSection({ userId, role, wallet, primary, onNotice }: WalletSectionProps) {
  const [editing, setEditing] = useState(false)
  const needsPrimary = role === 'secondary' && !primary
  const headingId = `carteira-${role}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg leading-4 font-bold">
          {TITLES[role]}
        </h2>
        {!editing && (
          <Button
            type="button"
            variant="link"
            disabled={needsPrimary}
            aria-label={`${wallet ? 'Editar' : 'Adicionar'} ${TITLES[role].toLowerCase()}`}
            className="h-auto px-0 text-base font-medium"
            onClick={() => {
              setEditing(true)
            }}
          >
            {wallet ? 'Editar' : 'Adicionar'}
          </Button>
        )}
      </div>

      {role === 'primary' && (
        <p className="text-sm text-content-secondary">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
      )}

      {editing ? (
        <WalletForm
          userId={userId}
          role={role}
          wallet={wallet}
          template={primary}
          onCancel={() => {
            setEditing(false)
          }}
          onSaved={(message) => {
            setEditing(false)
            onNotice(message)
          }}
        />
      ) : wallet ? (
        <WalletSummary wallet={wallet} onNotice={onNotice} />
      ) : (
        <p className="text-sm text-content-secondary">
          {needsPrimary
            ? 'Adicione a carteira principal antes da secundária.'
            : `Você ainda não adicionou uma ${TITLES[role].toLowerCase()}.`}
        </p>
      )}
    </section>
  )
}

export function WalletsPage() {
  const { data: session } = useSession()
  const { data, error, isFetching, refetch } = useQuery(walletsQueryOptions)
  const [notice, setNotice] = useState<string | null>(null)
  const primary = data?.items.find(({ role }) => role === 'primary')
  const secondary = data?.items.find(({ role }) => role === 'secondary')

  return (
    <AccountLayout>
      <h1 className="sr-only">Carteiras</h1>
      {error && !data && (
        <AccountError
          title="Não foi possível carregar as carteiras"
          error={error}
          retrying={isFetching}
          onRetry={() => {
            void refetch()
          }}
        />
      )}
      {!error && !data && <AccountSkeleton />}
      {data && session && (
        <div className="flex flex-col gap-8">
          <p role="status" className="text-sm text-content-accent empty:hidden">
            {notice}
          </p>
          {/* Keyed by wallet: after a swap each section must start from its new wallet. */}
          <WalletSection
            key={`primary-${primary?.id ?? 'none'}`}
            userId={session.user.id}
            role="primary"
            wallet={primary}
            primary={primary}
            onNotice={setNotice}
          />
          <WalletSection
            key={`secondary-${secondary?.id ?? 'none'}`}
            userId={session.user.id}
            role="secondary"
            wallet={secondary}
            primary={primary}
            onNotice={setNotice}
          />
        </div>
      )}
    </AccountLayout>
  )
}
