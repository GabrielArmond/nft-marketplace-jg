import * as z from 'zod/mini'

import type { Profile, Wallet, WalletType } from '@/contracts/account'
import { emailSchema } from '@/contracts/auth'
import { networkSchema, type Network } from '@/contracts/common'
import type { Collector } from '@/contracts/orders'
import type { CheckoutDraft } from '@/features/checkout/attempt-storage'

export const ENS_SUFFIXES = ['.eth'] as const

function requiredText(message: string) {
  return z.string(message).check(z.trim(), z.minLength(1, message))
}

export const checkoutFormSchema = z.object({
  displayName: requiredText('Informe o nome de exibição.'),
  username: requiredText('Informe o nome de usuário.'),
  profileName: requiredText('Informe o nome do perfil.'),
  email: emailSchema,
  network: networkSchema,
  walletId: requiredText('Selecione uma carteira.'),
  ensLabel: z
    .string()
    .check(
      z.trim(),
      z.regex(
        /^$|^[a-z0-9][a-z0-9.-]*$|^0x[0-9a-fA-F]{40}$/,
        'Use um nome ENS ou um endereço 0x.',
      ),
    ),
  ensSuffix: z.enum(ENS_SUFFIXES),
  referralCode: z
    .string()
    .check(z.trim(), z.regex(/^$|^[A-Za-z0-9-]{4,20}$/, 'Use de 4 a 20 letras ou números.')),
  note: z.string().check(z.maxLength(500, 'Use até 500 caracteres.')),
})
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
  walletconnect: 'WalletConnect',
}

function fromDraft(draft: CheckoutDraft | null, key: keyof CheckoutFormValues, fallback: string) {
  return draft?.[key] ?? fallback
}

/** The account fills the form; whatever was typed before a refresh or login wins. */
export function buildDefaults(
  profile: Profile,
  wallets: readonly Wallet[],
  draft: CheckoutDraft | null,
): CheckoutFormValues {
  const primary = wallets.find(({ role }) => role === 'primary') ?? wallets[0]
  const savedWallet = wallets.find(({ id }) => id === draft?.walletId)
  const network = z.safeParse(networkSchema, draft?.network)

  return {
    displayName: fromDraft(draft, 'displayName', profile.displayName),
    username: fromDraft(draft, 'username', profile.username),
    profileName: fromDraft(draft, 'profileName', profile.displayName),
    email: fromDraft(draft, 'email', profile.email),
    network: network.data ?? savedWallet?.network ?? primary?.network ?? 'ethereum',
    walletId: savedWallet?.id ?? (draft?.network ? '' : (primary?.id ?? '')),
    ensLabel: fromDraft(draft, 'ensLabel', profile.ensName),
    ensSuffix: '.eth',
    referralCode: fromDraft(draft, 'referralCode', ''),
    note: fromDraft(draft, 'note', ''),
  }
}

function ensName({ ensLabel, ensSuffix }: CheckoutFormValues): string {
  const isComplete = ensLabel.includes('.') || ensLabel.startsWith('0x')
  return !ensLabel || isComplete ? ensLabel : `${ensLabel}${ensSuffix}`
}

export function toCollector(values: CheckoutFormValues): Collector {
  const { displayName, username, profileName, email, referralCode, note } = values
  const ens = ensName(values)

  return {
    displayName,
    username,
    profileName,
    email,
    ...(referralCode && { referralCode }),
    ...(ens && { ensName: ens }),
    ...(note && { note }),
  }
}

export function walletForNetwork(wallets: readonly Wallet[], network: Network): Wallet | undefined {
  return wallets.find((wallet) => wallet.network === network)
}
