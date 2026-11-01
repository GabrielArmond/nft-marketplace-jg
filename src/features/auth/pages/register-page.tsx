import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { PasswordField } from '@/components/form/password-field'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { HomePage } from '@/features/catalog/pages/home-page'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { registerFormSchema, type RegisterFormValues } from '@/features/auth/forms'
import { useRegister } from '@/features/auth/hooks'
import type { AuthSearch } from '@/features/auth/redirect'
import { applyApiErrors } from '@/lib/forms/apply-api-errors'

const FIELDS = ['username', 'email', 'password'] as const

export function RegisterPage({ search }: { search: AuthSearch }) {
  const router = useRouter()
  const registerAccount = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) })

  const onSubmit = handleSubmit(async ({ username, email, password }) => {
    try {
      await registerAccount.mutateAsync({ displayName: username, username, email, password })
      router.history.push(search.redirect ?? '/')
    } catch (error) {
      applyApiErrors(error, FIELDS, setError)
    }
  })

  return (
    <>
      <HomePage />
      <AuthDialog
        mode="register"
        search={search}
        description="Crie seu perfil de colecionador e comece a montar sua coleção."
        mobileTitle="Criar perfil de colecionador"
        switchPrompt="Já tem uma conta?"
        switchLabel="Entre"
      >
        <form noValidate className="flex flex-col gap-3" onSubmit={(event) => void onSubmit(event)}>
          <TextField
            label="Nome de usuário"
            placeholder="Nome de usuário"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username')}
          />
          <TextField
            label="E-mail"
            type="email"
            placeholder="Digite seu e-mail"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordField
            label="Senha"
            placeholder="Senha"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordField
            label="Confirmar senha"
            placeholder="Confirmar senha"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          {errors.root?.server && (
            <p role="alert" className="text-xs text-destructive">
              {errors.root.server.message}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={registerAccount.isPending}
            className="mt-3 h-15 rounded-xl md:h-11.25 md:rounded-control"
          >
            {registerAccount.isPending ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>
      </AuthDialog>
    </>
  )
}
