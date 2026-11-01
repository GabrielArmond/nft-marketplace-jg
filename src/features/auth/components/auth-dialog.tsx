import { Link, useRouter } from '@tanstack/react-router'
import { Dialog } from 'radix-ui'
import { useState, type ReactNode } from 'react'

import { CloseIcon, FacebookLogoIcon, GoogleIcon } from '@/components/icons/icons'
import type { AuthSearch } from '@/features/auth/redirect'
import { cn } from '@/lib/utils'

const UNAVAILABLE_MESSAGE = 'Entrada social indisponível. Use e-mail e senha.'

interface AuthDialogProps {
  mode: 'login' | 'register'
  search: AuthSearch
  description: string
  mobileTitle: string
  switchPrompt: string
  switchLabel: string
  children: ReactNode
}

function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="flex h-10 w-full items-center justify-center gap-3 rounded-control border border-border text-caption font-medium text-content-secondary"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}

/**
 * Figma draws both flows as a modal over the marketplace on desktop and as a
 * full page on mobile. One dialog covers both: focus stays trapped either way.
 */
export function AuthDialog({
  mode,
  search,
  description,
  mobileTitle,
  switchPrompt,
  switchLabel,
  children,
}: AuthDialogProps) {
  const router = useRouter()
  const [notice, setNotice] = useState<string | null>(null)
  const isLogin = mode === 'login'

  function close() {
    router.history.push(search.redirect ?? '/')
  }

  function showUnavailable() {
    setNotice(UNAVAILABLE_MESSAGE)
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <Dialog.Portal>
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background px-7 pt-20 pb-6 md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[calc(100dvh-2rem)] md:w-125 md:-translate-x-1/2 md:-translate-y-1/2 md:border-b-10 md:border-primary md:bg-card md:px-0 md:pt-12 md:pb-16 md:shadow-ambient-lg"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            // Start where the user will type, not on the close button.
            const dialog = event.currentTarget
            if (dialog instanceof HTMLElement) {
              event.preventDefault()
              dialog.querySelector('input')?.focus()
            }
          }}
        >
          <Dialog.Close
            aria-label="Fechar"
            className="absolute top-5 right-5 flex size-8 items-center justify-center text-primary md:top-2 md:right-2"
          >
            <CloseIcon className="size-4.5" />
          </Dialog.Close>

          <Dialog.Title className="sr-only">{isLogin ? 'Entrar' : 'Criar conta'}</Dialog.Title>

          <p
            aria-hidden="true"
            className="flex min-h-34 items-center justify-center text-4xl font-bold tracking-wide md:hidden"
          >
            KURIO
          </p>
          <p
            aria-hidden="true"
            className={cn(
              'text-center font-bold md:hidden',
              isLogin ? 'text-xl leading-4' : 'text-lg leading-4',
            )}
          >
            {mobileTitle}
          </p>

          <nav aria-label="Acesso à conta" className="hidden flex-col gap-10 px-12 md:flex">
            <div className="flex items-center justify-center gap-2 text-xl leading-4 font-medium">
              <Link
                to="/login"
                search={search}
                className={isLogin ? 'text-content-accent' : undefined}
                aria-current={isLogin ? 'page' : undefined}
              >
                Entrar
              </Link>
              <span aria-hidden="true" className="h-5 w-px bg-content-coral" />
              <Link
                to="/cadastro"
                search={search}
                className={isLogin ? undefined : 'text-content-accent'}
                aria-current={isLogin ? undefined : 'page'}
              >
                Criar conta
              </Link>
            </div>
            <p className="text-center text-caption leading-4">{description}</p>
          </nav>

          {search.reason === 'expired' && (
            <p role="alert" className="mt-4 text-center text-sm text-destructive md:px-20">
              Sua sessão expirou. Entre novamente para continuar de onde parou.
            </p>
          )}

          <div className="mt-10 md:mt-6 md:px-20">{children}</div>

          <div className="mt-10 flex flex-col gap-3 md:mt-6">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
              <span className="text-caption leading-4">Ou continue com</span>
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </div>
            <div className="flex flex-col gap-3 md:px-20">
              <SocialButton
                icon={<GoogleIcon className="size-5" />}
                label="Continuar com Google"
                onClick={showUnavailable}
              />
              <SocialButton
                icon={<FacebookLogoIcon className="size-5" />}
                label="Continuar com Facebook"
                onClick={showUnavailable}
              />
              {notice && (
                <p role="status" className="text-center text-xs text-content-secondary">
                  {notice}
                </p>
              )}
            </div>
          </div>

          <p className="mt-10 text-center text-md text-content-secondary md:hidden">
            {switchPrompt}{' '}
            <Link
              to={isLogin ? '/cadastro' : '/login'}
              search={search}
              className="text-content-accent"
            >
              {switchLabel}
            </Link>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
