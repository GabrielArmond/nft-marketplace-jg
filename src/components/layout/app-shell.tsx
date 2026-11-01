import { Outlet, useRouterState, useSearch } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { Toaster } from '@/components/feedback/toaster'
import { SessionLifecycle } from '@/components/layout/session-lifecycle'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { TabBar } from '@/components/layout/tab-bar'

// Forms and validation stay out of the initial bundle until someone opens the dialog.
const AuthModal = lazy(() => import('@/features/auth/components/auth-modal'))

const AUTH_PATHS = ['/login', '/cadastro']

export function AppShell() {
  // The mobile NFT and cart screens end in their own purchase area, without the tab bar.
  const pathname = useRouterState({ select: ({ location }) => location.pathname })
  const hasBuyBar = pathname.startsWith('/nft/')
  const hideTabBar = hasBuyBar || pathname === '/carrinho'
  const { auth } = useSearch({ strict: false })

  return (
    <>
      <SessionLifecycle />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:p-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter
        className={hasBuyBar ? 'max-md:pb-48' : hideTabBar ? 'max-md:pb-6' : undefined}
      />
      {!hideTabBar && <TabBar />}
      <Toaster />
      {auth && !AUTH_PATHS.includes(pathname) && (
        <Suspense fallback={null}>
          <AuthModal mode={auth} />
        </Suspense>
      )}
    </>
  )
}
