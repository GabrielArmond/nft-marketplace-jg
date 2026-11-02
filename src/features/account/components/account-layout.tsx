import { Link, useNavigate } from '@tanstack/react-router'
import { useState, type ComponentType, type ReactNode, type SVGProps } from 'react'

import {
  ActivityOutlineIcon,
  AlertTriangleOutlineIcon,
  DownloadOutlineIcon,
  HeartLineIcon,
  LocationPinOutlineIcon,
  LogoutOutlineIcon,
  ShoppingOutlineIcon,
  UserOutlineIcon,
} from '@/components/icons/icons'
import { useLogout } from '@/features/auth/hooks'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'
import { cn } from '@/lib/utils'

const ITEM =
  'group flex h-11.25 w-full shrink-0 items-center whitespace-nowrap px-4 text-left text-md text-content-accent transition-colors duration-300 ease-in-out hover:text-primary'
// The Figma marks the current page with an inner 6px bar and a stronger icon.
const LINK_STATES = {
  activeProps: { className: 'shadow-[inset_6px_0_0_var(--color-primary)]' },
} as const
const ICON = 'shrink-0 text-content-subtle group-data-[status=active]:text-primary'

interface MenuItem {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Each row of the Figma has its own icon box and gap: the text does not line up. */
  iconClass: string
  gapClass: string
  to?: '/perfil' | '/carteiras' | '/favoritos'
}

const MENU: readonly MenuItem[] = [
  { label: 'Dados do perfil', icon: UserOutlineIcon, iconClass: 'size-4.5', gapClass: 'gap-4', to: '/perfil' },
  { label: 'Carteiras', icon: LocationPinOutlineIcon, iconClass: 'size-5', gapClass: 'gap-3', to: '/carteiras' },
  { label: 'Atividade', icon: ShoppingOutlineIcon, iconClass: 'size-4.5', gapClass: 'gap-3' },
  { label: 'Lista de interesse', icon: HeartLineIcon, iconClass: 'size-4', gapClass: 'gap-3', to: '/favoritos' },
  { label: 'Ofertas', icon: ActivityOutlineIcon, iconClass: 'size-4.5', gapClass: 'gap-3' },
  { label: 'Arquivos baixados', icon: DownloadOutlineIcon, iconClass: 'size-4.5', gapClass: 'gap-3' },
  { label: 'Suporte', icon: AlertTriangleOutlineIcon, iconClass: 'size-4.5', gapClass: 'gap-3' },
]

/** Frame of the private account screens. Actions outside this delivery say so. */
export function AccountLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const logout = useLogout()
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <div className="grid gap-6 pt-6 pb-10 page-container xl:grid-cols-[19.375rem_minmax(0,1fr)] xl:gap-7">
      <aside className="flex h-fit min-w-0 flex-col self-start bg-card py-2">
        <p className="p-2.5 text-lg leading-4 font-bold">Meu perfil</p>
        <nav aria-label="Minha conta">
          <ul className="flex overflow-x-auto xl:flex-col xl:overflow-visible">
            {MENU.map(({ label, icon: Icon, iconClass, gapClass, to }) => (
              <li key={label}>
                {to ? (
                  <Link to={to} className={cn(ITEM, gapClass)} {...LINK_STATES}>
                    <Icon className={cn(ICON, iconClass)} />
                    {label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={cn(ITEM, gapClass, 'cursor-pointer')}
                    onClick={() => {
                      setNotice(`${label} não está disponível.`)
                    }}
                  >
                    <Icon className={cn(ICON, iconClass)} />
                    {label}
                  </button>
                )}
              </li>
            ))}
            <li className="border-primary/30 xl:border-t">
              <button
                type="button"
                className={cn(ITEM, 'h-11 cursor-pointer gap-2 font-bold xl:h-10')}
                onClick={() => {
                  logout.mutate(undefined, {
                    onSuccess: () => {
                      void navigate({ to: '/' })
                    },
                  })
                }}
              >
                <LogoutOutlineIcon className="size-5 shrink-0 text-primary" />
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
        <p role="status" className="px-4 pt-2 text-xs text-content-secondary empty:hidden">
          {notice}
        </p>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
