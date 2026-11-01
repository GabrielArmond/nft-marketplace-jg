import { Link, useRouterState } from '@tanstack/react-router'

import { CartIcon, LoginIcon } from '@/components/icons/icons'
import { HeaderSearch } from '@/components/layout/header-search'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/hooks'
import { authModalTarget } from '@/features/auth/redirect'
import { useCartCount } from '@/features/cart/hooks'
import { cn } from '@/lib/utils'

const UNAVAILABLE_ITEMS = ['Criadores', 'Aprenda']
const NAV_ITEM = 'border-b-2 pb-6 text-base'
const MARKET_PATHS = ['/nft/', '/carrinho']

function AccountAction() {
  const { data: session, isPending } = useSession()

  if (isPending) return <Skeleton className="h-8.75 w-25" />

  if (session) {
    return (
      <Link
        to="/perfil"
        className="flex max-w-48 items-center gap-2 text-base font-medium hover:text-content-accent"
      >
        {session.user.avatarUrl && (
          <img
            src={session.user.avatarUrl}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 rounded-full object-cover"
          />
        )}
        <span className="truncate">{session.user.displayName}</span>
      </Link>
    )
  }

  return (
    <Button asChild size="sm" className="h-8.75 w-25 gap-1 px-0 font-medium">
      <Link {...authModalTarget('login')}>
        <LoginIcon />
        Entrar
      </Link>
    </Button>
  )
}

/** Desktop and tablet only: below `md` the Figma navigation is the bottom tab bar. */
export function SiteHeader() {
  const cartCount = useCartCount()
  const inMarket = useRouterState({
    select: ({ location }) => MARKET_PATHS.some((path) => location.pathname.startsWith(path)),
  })

  return (
    <header className="page-container hidden md:block">
      {/* The Figma divider is 0.3px wide: 30% opacity is how it renders on a 1px grid. */}
      <div className="flex items-end justify-between gap-6 border-b border-primary/30 pt-7 xl:grid xl:grid-cols-[10rem_1fr_auto]">
        <Link to="/" className="pb-5 text-sm font-bold tracking-wide">
          KURIO
        </Link>

        <nav aria-label="Principal" className="flex items-end gap-6 xl:justify-center xl:gap-10">
          <Link
            to="/"
            hash=""
            activeOptions={{ exact: true, includeHash: true, includeSearch: false }}
            className={NAV_ITEM}
            activeProps={{ className: 'border-primary font-bold text-content-accent' }}
            inactiveProps={{ className: 'border-transparent' }}
          >
            Início
          </Link>
          <Link
            to="/"
            hash="catalogo"
            aria-current={inMarket ? 'page' : undefined}
            className={cn(
              NAV_ITEM,
              inMarket ? 'border-primary font-bold text-content-accent' : 'border-transparent',
            )}
          >
            Mercado
          </Link>
          {UNAVAILABLE_ITEMS.map((item) => (
            <span
              key={item}
              aria-disabled="true"
              title="Em breve"
              className={`${NAV_ITEM} border-transparent opacity-60`}
            >
              {item}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-7 pb-2.5">
          <HeaderSearch />
          <Link
            to="/carrinho"
            aria-label={`Carrinho, ${cartCount.toString()} ${cartCount === 1 ? 'item' : 'itens'}`}
            className="relative"
          >
            <CartIcon className="h-6 w-6.25" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-tiny font-medium text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          <AccountAction />
        </div>
      </div>
    </header>
  )
}
