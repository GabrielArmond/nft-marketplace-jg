import { createRootRouteWithContext } from '@tanstack/react-router'

import type { RouterContext } from '@/app/router-context'
import { AppShell } from '@/components/layout/app-shell'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
})
