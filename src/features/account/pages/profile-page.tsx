import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { PasswordField } from '@/components/form/password-field'
import { SelectField } from '@/components/form/select-field'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import type { Profile, Wallet } from '@/contracts/account'
import { AccountError } from '@/features/account/components/account-error'
import { AccountLayout } from '@/features/account/components/account-layout'
import { AccountSkeleton } from '@/features/account/components/account-skeleton'
import { AvatarField } from '@/features/account/components/avatar-field'
import {
  clearAccountDraft,
  loadAccountDraft,
  saveAccountDraft,
} from '@/features/account/draft-storage'
import { ENS_SUFFIXES, profileFormSchema, type ProfileFormValues } from '@/features/account/forms'
import {
  useChangePassword,
  useUpdateProfile,
  useUpdateWallet,
} from '@/features/account/hooks'
import { profileQueryOptions, walletsQueryOptions } from '@/features/account/queries'
import { applyApiErrors } from '@/lib/forms/apply-api-errors'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'

const FIELD = 'md:h-10 md:rounded-xs md:text-sm'
const ENS_OPTIONS = ENS_SUFFIXES.map((value) => ({ value, label: value }))
const PROFILE_FIELDS = ['displayName', 'username', 'ensName'] as const
const PASSWORD_FIELDS = ['currentPassword', 'newPassword'] as const
const NO_PASSWORD = { currentPassword: '', newPassword: '', confirmPassword: '' }

interface ProfileFormProps {
  profile: Profile
  primary: Wallet | undefined
}

function ProfileForm({ profile, primary }: ProfileFormProps) {
  const draftKey = `profile.${profile.id}`
  const updateProfile = useUpdateProfile()
  const updateWallet = useUpdateWallet(primary?.id ?? '')
  const changePassword = useChangePassword()
  const [saved, setSaved] = useState<string | null>(null)
  const [restored] = useState(() => loadAccountDraft(draftKey))
  const submitting = useRef(false)
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting, dirtyFields },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      email: profile.email,
      ensName: profile.ensName,
      ensSuffix: '.eth',
      walletLabel: primary?.label ?? '',
      ...NO_PASSWORD,
    },
  })
  const { displayName, username, ensName, walletLabel } = useWatch({ control })

  useEffect(() => {
    if (restored) reset((current) => ({ ...current, ...restored }), { keepDefaultValues: true })
  }, [reset, restored])

  // Passwords stay out on purpose: only these four fields ever reach storage.
  useEffect(() => {
    if (isDirty) {
      saveAccountDraft(draftKey, {
        displayName: displayName ?? '',
        username: username ?? '',
        ensName: ensName ?? '',
        walletLabel: walletLabel ?? '',
      })
    } else {
      clearAccountDraft(draftKey)
    }
  }, [displayName, draftKey, ensName, isDirty, username, walletLabel])

  async function save(values: ProfileFormValues) {
    if (submitting.current) return
    submitting.current = true
    setSaved(null)
    const baseline = { ...values, ...NO_PASSWORD }
    const profileChanged = dirtyFields.displayName ?? dirtyFields.username ?? dirtyFields.ensName
    const labelChanged = dirtyFields.walletLabel === true && primary

    try {
      if (primary && !values.walletLabel) {
        setError('walletLabel', { message: 'Informe o apelido.' })
        return
      }

      if (profileChanged) {
        try {
          const { displayName: name, username: handle, ensName: ens } = values
          await updateProfile.mutateAsync({ displayName: name, username: handle, ensName: ens })
        } catch (error) {
          if (!isApiError(error, 'unauthorized')) applyApiErrors(error, PROFILE_FIELDS, setError)
          return
        }
      }

      if (labelChanged) {
        try {
          await updateWallet.mutateAsync({ label: values.walletLabel })
        } catch (error) {
          if (!isApiError(error, 'unauthorized')) {
            const { fieldErrors, message } = normalizeApiError(error)
            setError('walletLabel', { message: fieldErrors.label?.[0] ?? message })
          }
          return
        }
      }

      if (values.currentPassword) {
        // What is already saved must not count as unsaved if the password fails.
        reset(baseline, { keepValues: true })
        try {
          await changePassword.mutateAsync({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          })
        } catch (error) {
          if (!isApiError(error, 'unauthorized')) applyApiErrors(error, PASSWORD_FIELDS, setError)
          return
        }
      }

      reset(baseline)
      setSaved('Alterações salvas.')
    } finally {
      submitting.current = false
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-base leading-4 font-bold">Perfil do colecionador</h1>
      <form
        noValidate
        aria-label="Dados do perfil"
        className="flex flex-col gap-6"
        onSubmit={(event) => void handleSubmit(save)(event)}
      >
        <div className="grid gap-5 md:grid-cols-2 md:gap-x-7">
          <TextField
            showLabel
            required
            label="Nome de exibição"
            autoComplete="name"
            className={FIELD}
            error={errors.displayName?.message}
            {...register('displayName')}
          />
          <TextField
            showLabel
            required
            label="Nome de usuário"
            autoComplete="username"
            className={FIELD}
            error={errors.username?.message}
            {...register('username')}
          />
          <TextField
            showLabel
            readOnly
            required
            type="email"
            label="E-mail"
            className={FIELD}
            {...register('email')}
          />
          <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-2.5">
            <SelectField label="Sufixo" options={ENS_OPTIONS} {...register('ensSuffix')} />
            <TextField
              showLabel
              label="Nome ENS"
              className={FIELD}
              error={errors.ensName?.message}
              {...register('ensName')}
            />
          </div>
          {primary ? (
            <TextField
              showLabel
              required
              label="Apelido da carteira"
              className={FIELD}
              error={errors.walletLabel?.message}
              {...register('walletLabel')}
            />
          ) : (
            <p className="self-center text-sm text-content-secondary">
              Cadastre uma carteira em{' '}
              <Link to="/carteiras" className="text-content-accent underline">
                Carteiras
              </Link>{' '}
              para definir o apelido.
            </p>
          )}
          <AvatarField avatarUrl={profile.avatarUrl} />
        </div>

        <fieldset className="flex min-w-0 flex-col gap-4">
          <legend className="mb-4 text-base leading-4 font-medium">Alterar senha</legend>
          <PasswordField
            showLabel
            label="Senha atual"
            autoComplete="current-password"
            className={FIELD}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <PasswordField
            showLabel
            label="Nova senha"
            autoComplete="new-password"
            className={FIELD}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordField
            showLabel
            label="Confirmar nova senha"
            autoComplete="new-password"
            className={FIELD}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </fieldset>

        {errors.root?.server && (
          <p role="alert" className="text-xs text-destructive">
            {errors.root.server.message}
          </p>
        )}
        <p role="status" className="text-sm text-content-accent empty:hidden">
          {saved ?? (isDirty ? 'Há alterações não salvas.' : null)}
        </p>
        <Button type="submit" disabled={!isDirty || isSubmitting} className="w-full md:w-33">
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </div>
  )
}

export function ProfilePage() {
  const profile = useQuery(profileQueryOptions)
  const wallets = useQuery(walletsQueryOptions)
  const failed = [profile, wallets].find(({ error, data }) => error && !data)

  return (
    <AccountLayout>
      {failed?.error && (
        <AccountError
          title="Não foi possível carregar o perfil"
          error={failed.error}
          retrying={failed.isFetching}
          onRetry={() => {
            void profile.refetch()
            void wallets.refetch()
          }}
        />
      )}
      {!failed && !(profile.data && wallets.data) && <AccountSkeleton />}
      {profile.data && wallets.data && (
        <ProfileForm
          key={profile.data.id}
          profile={profile.data}
          primary={wallets.data.items.find(({ role }) => role === 'primary')}
        />
      )}
    </AccountLayout>
  )
}
