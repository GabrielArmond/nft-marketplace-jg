import { createFileRoute, redirect } from '@tanstack/react-router'

import { LoginPage } from '@/features/auth/pages/login-page'
import { sessionQueryOptions } from '@/features/auth/queries'
import { validateAuthSearch } from '@/features/auth/redirect'

export const Route = createFileRoute('/login')({
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.query(sessionQueryOptions)
    if (session) throw redirect({ href: search.redirect ?? '/' })
  },
  component: function LoginRoute() {
    return <LoginPage search={Route.useSearch()} />
  },
})
