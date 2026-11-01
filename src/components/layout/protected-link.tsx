import { Link } from '@tanstack/react-router'
import type { ComponentProps } from 'react'

import { useSession } from '@/features/auth/hooks'
import { authModalTarget } from '@/features/auth/redirect'
import { cn } from '@/lib/utils'

interface ProtectedLinkProps extends Omit<ComponentProps<'a'>, 'href'> {
  to: '/perfil' | '/favoritos' | '/pagamento'
  activeClassName?: string
  inactiveClassName?: string
}

/**
 * Link to a private route. A visitor stays on the current page, under the login
 * dialog, and continues to the destination after authenticating.
 */
export function ProtectedLink({
  to,
  className,
  activeClassName,
  inactiveClassName,
  ...props
}: ProtectedLinkProps) {
  const { data: session, isPending } = useSession()

  if (session || isPending) {
    return (
      <Link
        to={to}
        className={className}
        activeProps={{ className: activeClassName }}
        inactiveProps={{ className: inactiveClassName }}
        {...props}
      />
    )
  }

  return (
    <Link {...authModalTarget('login', to)} className={cn(className, inactiveClassName)} {...props} />
  )
}
