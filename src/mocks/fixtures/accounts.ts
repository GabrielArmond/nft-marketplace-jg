import type { CouponRecord, UserRecord, WalletRecord } from '@/mocks/db/types'

/**
 * Fictional accounts. Only salted SHA-256 hashes live here, never the passwords:
 *   anna@kurio.test   / Kurio@2026
 *   gabriel@kurio.test / Mint#2026
 */
export const ANNA_ID = 'usr_anna'
export const GABRIEL_ID = 'usr_gabriel'

export function createUserFixtures(): UserRecord[] {
  return [
    {
      id: ANNA_ID,
      email: 'anna@kurio.test',
      username: 'anna_coleciona',
      displayName: 'Anna Almeida',
      bio: 'Coleciono retratos digitais.',
      website: 'https://anna.kurio.test',
      ensName: 'annaalmeida',
      avatarUrl: null,
      passwordSalt: 'f1c2a9d04b7e4a16',
      passwordHash: '4f70bec876ffb18137725630b8b3d8e311b5f450e5b21cd0f18ceba888552fd9',
    },
    {
      id: GABRIEL_ID,
      email: 'gabriel@kurio.test',
      username: 'gabriel_mint',
      displayName: 'Gabriel Guerra',
      bio: '',
      website: '',
      ensName: '',
      avatarUrl: null,
      passwordSalt: '9be47d13c05a4f28',
      passwordHash: '083d16ca116d615adf1b7ff1dd28ae309dc63fb705d85a7919644569a559225f',
    },
  ]
}

export function createWalletFixtures(): WalletRecord[] {
  return [
    {
      id: 'wal_anna_primary',
      userId: ANNA_ID,
      role: 'primary',
      label: 'Carteira principal',
      type: 'metamask',
      network: 'ethereum',
      address: '0x7A42000000000000000000000000000000A119E8',
      ensName: 'annaalmeida.eth',
      connected: false,
    },
    {
      id: 'wal_anna_secondary',
      userId: ANNA_ID,
      role: 'secondary',
      label: 'Reserva',
      type: 'coinbase',
      network: 'polygon',
      address: '0xA91F00000000000000000000000000000000E82C',
      ensName: '',
      connected: false,
    },
    {
      id: 'wal_gabriel_primary',
      userId: GABRIEL_ID,
      role: 'primary',
      label: 'Carteira do Gabriel',
      type: 'walletconnect',
      network: 'ethereum',
      address: '0xB2C300000000000000000000000000000000D4F1',
      ensName: '',
      connected: false,
    },
  ]
}

export const VALID_COUPON_CODE = 'KURIO10'
export const EXPIRED_COUPON_CODE = 'LANCAMENTO'

export function createCouponFixtures(): CouponRecord[] {
  return [
    { code: VALID_COUPON_CODE, basisPoints: 1_000, expiresAt: '2099-12-31T23:59:59.000Z' },
    { code: EXPIRED_COUPON_CODE, basisPoints: 2_000, expiresAt: '2020-01-01T00:00:00.000Z' },
  ]
}
