import { createFileRoute, redirect } from '@tanstack/react-router'

import { RegisterPage } from '@/features/auth/pages/register-page'
import { sessionQueryOptions } from '@/features/auth/queries'
import { validateAuthSearch } from '@/features/auth/redirect'

export const Route = createFileRoute('/cadastro')({
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.query(sessionQueryOptions)
    if (session) throw redirect({ href: search.redirect ?? '/' })
  },
  component: function RegisterRoute() {
    return <RegisterPage search={Route.useSearch()} />
  },
})
