import { Link, useNavigate } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'

const ITEM =
  'flex h-11 shrink-0 items-center whitespace-nowrap px-4 text-md text-content-accent xl:h-11.25'
const LINK_STATES = {
  activeProps: { className: 'border border-primary font-bold' },
  inactiveProps: { className: 'border border-transparent' },
} as const
const UNAVAILABLE = ['Atividade', 'Ofertas', 'Arquivos baixados', 'Suporte']

/** Frame of the private account screens. Actions outside this delivery say so. */
export function AccountLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const logout = useLogout()
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <div className="grid gap-6 pt-6 pb-10 page-container xl:grid-cols-[19.375rem_minmax(0,1fr)] xl:gap-7">
      <aside className="flex min-w-0 flex-col gap-1">
        <p className="px-2.5 py-2.5 text-lg leading-4 font-bold">Meu perfil</p>
        <nav aria-label="Minha conta">
          <ul className="flex gap-1 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
            <li>
              <Link to="/perfil" className={ITEM} {...LINK_STATES}>
                Dados do perfil
              </Link>
            </li>
            <li>
              <Link to="/carteiras" className={ITEM} {...LINK_STATES}>
                Carteiras
              </Link>
            </li>
            <li>
              <Link to="/favoritos" className={ITEM} {...LINK_STATES}>
                Lista de interesse
              </Link>
            </li>
            {UNAVAILABLE.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className={`${ITEM} w-full border border-transparent text-left`}
                  onClick={() => {
                    setNotice(`${item} não está disponível.`)
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <p role="status" className="px-4 text-xs text-content-secondary empty:hidden">
          {notice}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={logout.isPending}
          className="mt-2 self-start text-content-accent xl:w-full"
          onClick={() => {
            logout.mutate(undefined, {
              onSuccess: () => {
                void navigate({ to: '/' })
              },
            })
          }}
        >
          {logout.isPending ? 'Saindo...' : 'Sair'}
        </Button>
        {logout.error && !isApiError(logout.error, 'unauthorized') && (
          <p role="alert" className="px-4 text-xs text-destructive">
            {normalizeApiError(logout.error).message}
          </p>
        )}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
