import { createRootRouteWithContext } from '@tanstack/react-router'

import type { RouterContext } from '@/app/router-context'
import { AppShell } from '@/components/layout/app-shell'
import { validateAuthSearch } from '@/features/auth/redirect'

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: validateAuthSearch,
  component: AppShell,
})
