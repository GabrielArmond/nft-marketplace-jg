import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { PasswordField } from '@/components/form/password-field'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { loginFormSchema, type LoginFormValues } from '@/features/auth/forms'
import { useLogin } from '@/features/auth/hooks'
import { applyApiErrors } from '@/lib/forms/apply-api-errors'

const FIELDS = ['email', 'password'] as const

export function LoginForm({ onDone }: { onDone: () => void }) {
  const login = useLogin()
  const [forgotNotice, setForgotNotice] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      onDone()
    } catch (error) {
      applyApiErrors(error, FIELDS, setError)
    }
  })

  return (
    <form noValidate className="flex flex-col gap-3" onSubmit={(event) => void onSubmit(event)}>
      <TextField
        label="E-mail"
        type="email"
        placeholder="contato@email.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        placeholder="Senha"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <button
        type="button"
        className="self-end text-sm leading-4 text-content-accent cursor-pointer hover:text-primary duration-150 ease-in-out"
        onClick={() => {
          setForgotNotice(true)
        }}
      >
        Esqueceu a senha?
      </button>
      {forgotNotice && (
        <p role="status" className="text-xs text-content-secondary">
          A recuperação de senha não está disponível.
        </p>
      )}
      {errors.root?.server && (
        <p role="alert" className="text-xs text-destructive">
          {errors.root.server.message}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={login.isPending}
        className="mt-3 h-15 rounded-xl md:h-11.25 md:rounded-control"
      >
        {login.isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
