import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthPage } from '@/features/auth/components/auth-page'
import { sessionQueryOptions } from '@/features/auth/queries'
import { validateAuthSearch } from '@/features/auth/redirect'

export const Route = createFileRoute('/login')({
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.query(sessionQueryOptions)
    if (session) throw redirect({ href: search.redirect ?? '/' })
  },
  component: function LoginRoute() {
    return <AuthPage mode="login" search={Route.useSearch()} />
  },
})
