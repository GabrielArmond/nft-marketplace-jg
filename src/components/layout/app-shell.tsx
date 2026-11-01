import { Outlet } from '@tanstack/react-router'

import { SessionLifecycle } from '@/components/layout/session-lifecycle'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { TabBar } from '@/components/layout/tab-bar'

export function AppShell() {
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
      <SiteFooter />
      <TabBar />
    </>
  )
}
