import { Link, useNavigate } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'

import { useLogout } from '@/features/auth/hooks'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'
import { CartIcon, DownloadOutlineIcon, HeartOutlineIcon, OfferOutlineIcon, SignOutOutlineIcon, SupportOutlineIcon, UserOutlineIcon, WalletOutlineIcon } from '@/components/icons/icons'

const ICON_SIZE = 'h-[18px] w-[18px]'
const ITEM =
  'flex h-11 shrink-0 items-center whitespace-nowrap px-4 text-md text-content-accent xl:h-11.25'
const LINK_STATES = {
  activeProps: { className: 'border-l-4 border-primary bg-background/5 font-bold text-primary' },
  inactiveProps: { className: 'border-l-4 border-transparent' },
} as const
const AVAILABLE = [
  { label: 'Dados do perfil', icon: <UserOutlineIcon className={ICON_SIZE} />, to: '/perfil' },
  { label: 'Carteiras', icon: <WalletOutlineIcon className={ICON_SIZE} />, to: '/carteiras' },
  { label: 'Lista de interesse', icon: <HeartOutlineIcon className={ICON_SIZE} />, to: '/favoritos' }]
const UNAVAILABLE = [
  { label: 'Atividade', icon: <CartIcon className={ICON_SIZE} /> },
  { label: 'Ofertas', icon: <OfferOutlineIcon className={ICON_SIZE} /> },
  { label: 'Arquivos baixados', icon: <DownloadOutlineIcon className={ICON_SIZE} /> },
  { label: 'Suporte', icon: <SupportOutlineIcon className={ICON_SIZE} /> }]


/** Frame of the private account screens. Actions outside this delivery say so. */
export function AccountLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const logout = useLogout()
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <div className="grid gap-6 pt-6 pb-10 page-container xl:grid-cols-[19.375rem_minmax(0,1fr)] xl:gap-7">
      <aside className="flex h-fit min-w-0 flex-col gap-1 self-start bg-card">
        <p className="px-2.5 py-2.5 text-lg leading-4 font-bold">Meu perfil</p>
        <nav aria-label="Minha conta">
          <ul className="flex gap-1 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
            {AVAILABLE.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className={`${ITEM} w-full text-left flex items-center gap-3 hover:text-primary duration-300 ease-in-out`} {...LINK_STATES}>
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
            {UNAVAILABLE.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={`${ITEM} w-full border border-transparent text-left flex items-center gap-3 cursor-pointer hover:text-primary duration-300 ease-in-out`}
                  onClick={() => {
                    setNotice(`${item.label} não está disponível.`)
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
            <li className="border-t border-primary">
              <button
                type="button"
                className={`${ITEM} w-full border border-transparent text-left flex items-center gap-2 cursor-pointer hover:text-primary duration-300 ease-in-out`}
                onClick={() => {
                  logout.mutate(undefined, {
                    onSuccess: () => {
                      void navigate({ to: '/' })
                    },
                  })
                }}
              >
                <SignOutOutlineIcon className={ICON_SIZE} />
                {logout.isPending ? 'Saindo...' : 'Sair'}
              </button>
              {logout.error && !isApiError(logout.error, 'unauthorized') && (
                <p role="alert" className="px-4 text-xs text-destructive">
                  {normalizeApiError(logout.error).message}
                </p>
              )}
            </li>
          </ul>
        </nav>
        <p role="status" className="px-4 text-xs text-content-secondary empty:hidden mb-5">
          {notice}
        </p>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
