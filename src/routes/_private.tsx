import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { sessionQueryOptions } from '@/features/auth/queries'

/** Layout of every route that requires an account. The API enforces it too. */
export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.query(sessionQueryOptions)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: Outlet,
})
