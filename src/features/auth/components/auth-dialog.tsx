import { Dialog } from 'radix-ui'
import { useRef, useState, type ReactNode } from 'react'

import { CloseIcon, FacebookLogoIcon, GoogleIcon } from '@/components/icons/icons'
import { LoginForm } from '@/features/auth/components/login-form'
import { RegisterForm } from '@/features/auth/components/register-form'
import type { AuthMode } from '@/features/auth/redirect'
import { cn } from '@/lib/utils'

const UNAVAILABLE_MESSAGE = 'Entrada social indisponível. Use e-mail e senha.'

const COPY: Record<
  AuthMode,
  { title: string; description: string; mobileTitle: string; prompt: string; action: string }
> = {
  login: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    mobileTitle: 'Entrar',
    prompt: 'Novo na Kurio?',
    action: 'Crie uma conta',
  },
  register: {
    title: 'Criar conta',
    description: 'Crie seu perfil de colecionador e comece a montar sua coleção.',
    mobileTitle: 'Criar perfil de colecionador',
    prompt: 'Já tem uma conta?',
    action: 'Entre',
  },
}

interface AuthDialogProps {
  mode: AuthMode
  expired: boolean
  onClose: () => void
  onDone: () => void
  onSwitch: (mode: AuthMode) => void
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
      className="flex h-10 w-full items-center justify-center gap-3 rounded-control border border-border text-caption font-medium text-content-secondary cursor-pointer hover:border-primary duration-150 ease-in-out"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}

export function AuthDialog({ mode, expired, onClose, onDone, onSwitch }: AuthDialogProps) {
  const [notice, setNotice] = useState<string | null>(null)
  const openedFrom = useRef<HTMLElement | null>(null)
  const isLogin = mode === 'login'
  const { title, description, mobileTitle, prompt, action } = COPY[mode]

  function showUnavailable() {
    setNotice(UNAVAILABLE_MESSAGE)
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background px-7 pt-20 pb-6 md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[calc(100dvh-2rem)] md:w-125 md:-translate-x-1/2 md:-translate-y-1/2 md:border-b-10 md:border-primary md:bg-card md:px-0 md:pt-12 md:pb-16 md:shadow-ambient-lg"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            // Start where the user will type, not on the close button.
            const { activeElement } = document
            openedFrom.current = activeElement instanceof HTMLElement ? activeElement : null

            const dialog = event.currentTarget
            if (dialog instanceof HTMLElement) {
              event.preventDefault()
              dialog.querySelector('input')?.focus()
            }
          }}
          onCloseAutoFocus={(event) => {
            // No Dialog.Trigger here: the trigger lives anywhere on the page.
            event.preventDefault()
            openedFrom.current?.focus()
          }}
        >
          <Dialog.Close
            aria-label="Fechar"
            className="absolute top-5 right-5 flex size-8 items-center justify-center text-primary md:top-2 md:right-2 cursor-pointer hover:text-primary/80 duration-300 ease-in-out"
          >
            <CloseIcon className="size-4.5" />
          </Dialog.Close>

          <Dialog.Title className="sr-only">{title}</Dialog.Title>

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

          <div className="hidden flex-col gap-10 px-12 md:flex">
            <div
              role="tablist"
              aria-label="Acesso à conta"
              className="flex items-center justify-center gap-2 text-xl leading-4 font-medium"
            >
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={isLogin ? 'text-content-accent' : 'cursor-pointer hover:text-primary'}
                onClick={() => {
                  onSwitch('login')
                }}
              >
                Entrar
              </button>
              <span aria-hidden="true" className="h-5 w-px bg-content-coral" />
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                className={isLogin ? 'cursor-pointer hover:text-primary' : 'text-content-accent'}
                onClick={() => {
                  onSwitch('register')
                }}
              >
                Criar conta
              </button>
            </div>
            <p className="text-center text-caption leading-4">{description}</p>
          </div>

          {expired && (
            <p role="alert" className="mt-4 text-center text-sm text-destructive md:px-20">
              Sua sessão expirou. Entre novamente para continuar de onde parou.
            </p>
          )}

          <div className="mt-10 md:mt-6 md:px-20">
            {isLogin ? <LoginForm onDone={onDone} /> : <RegisterForm onDone={onDone} />}
          </div>

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
            {prompt}{' '}
            <button
              type="button"
              className="text-content-accent"
              onClick={() => {
                onSwitch(isLogin ? 'register' : 'login')
              }}
            >
              {action}
            </button>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
