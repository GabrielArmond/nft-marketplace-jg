import { Link } from '@tanstack/react-router'
import type { ComponentProps, ComponentType } from 'react'

import { HeartIcon, HomeIcon, ScanIcon, ShopIcon, UserIcon } from '@/components/icons/icons'
import { ProtectedLink } from '@/components/layout/protected-link'
import { useCartCount } from '@/features/cart/hooks'

const TAB = 'flex size-11 items-center justify-center'
// Separate props: TanStack adds these classes, so a shared base colour would win over them.
const TAB_STATES = {
  activeProps: { className: 'text-content-accent' },
  inactiveProps: { className: 'text-content-secondary' },
}

function TabIcon({ icon: Icon }: { icon: ComponentType<ComponentProps<'svg'>> }) {
  return <Icon className="size-5" />
}

/** Mobile navigation. The notched background is the Figma vector, stretched to the width. */
export function TabBar() {
  const cartCount = useCartCount()

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] drop-shadow-[0_-10px_30px_rgb(10_6_4/0.45)] md:hidden"
    >
      <svg
        viewBox="30 40 414 95"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-23.75 w-full text-card"
      >
        <path
          fill="currentColor"
          d="M312.85 40C299.09 40 286.87 48.2 281.02 60.65C273.26 77.17 256.46 88.62 237 88.62C217.54 88.62 200.74 77.18 192.98 60.65C187.13 48.2 174.9 40 161.15 40H58.93C42.95 40 30 52.95 30 68.93V134.95H444V68.93C444 52.95 431.05 40 415.07 40H312.85Z"
        />
      </svg>

      <div className="relative flex h-23.75 items-center justify-between px-8">
        <Link
          to="/"
          aria-label="Início"
          className={TAB}
          activeOptions={{ exact: true, includeSearch: false }}
          {...TAB_STATES}
        >
          <TabIcon icon={HomeIcon} />
        </Link>
        <ProtectedLink
          to="/favoritos"
          aria-label="Favoritos"
          className={TAB}
          activeClassName={TAB_STATES.activeProps.className}
          inactiveClassName={TAB_STATES.inactiveProps.className}
        >
          <TabIcon icon={HeartIcon} />
        </ProtectedLink>

        <Link
          to="/"
          hash="catalogo"
          aria-label="Explorar catálogo"
          className="absolute -top-8 left-1/2 flex size-16.25 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-foreground"
        >
          <ScanIcon className="h-6 w-6.75" />
        </Link>

        <span aria-hidden="true" className="w-16.25" />

        <Link
          to="/carrinho"
          aria-label={`Carrinho, ${cartCount.toString()} ${cartCount === 1 ? 'item' : 'itens'}`}
          className={`${TAB} relative`}
          {...TAB_STATES}
        >
          <TabIcon icon={ShopIcon} />
          {cartCount > 0 && (
            <span className="absolute top-1 right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-tiny font-medium text-primary-foreground">
              {cartCount}
            </span>
          )}
        </Link>
        <ProtectedLink
          to="/perfil"
          aria-label="Perfil"
          className={TAB}
          activeClassName={TAB_STATES.activeProps.className}
          inactiveClassName={TAB_STATES.inactiveProps.className}
        >
          <TabIcon icon={UserIcon} />
        </ProtectedLink>
      </div>
    </nav>
  )
}
