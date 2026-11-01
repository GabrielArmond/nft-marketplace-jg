import { createFileRoute } from '@tanstack/react-router'

import { WalletsPage } from '@/features/account/pages/wallets-page'

export const Route = createFileRoute('/_private/carteiras')({
  component: WalletsPage,
})
