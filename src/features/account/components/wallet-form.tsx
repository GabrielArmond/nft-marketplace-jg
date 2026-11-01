import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { SelectField } from '@/components/form/select-field'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { WALLET_TYPES, type Wallet, type WalletRole } from '@/contracts/account'
import { NETWORKS } from '@/contracts/common'
import {
  clearAccountDraft,
  loadAccountDraft,
  saveAccountDraft,
} from '@/features/account/draft-storage'
import { walletFormSchema, type WalletFormValues } from '@/features/account/forms'
import { useCreateWallet, useUpdateWallet } from '@/features/account/hooks'
import { NETWORK_LABELS } from '@/features/catalog/search-params'
import { WALLET_TYPE_LABELS } from '@/features/checkout/forms'
import { applyApiErrors } from '@/lib/forms/apply-api-errors'
import { isApiError } from '@/lib/http/api-error'

const FIELD = 'md:h-10 md:rounded-xs md:text-sm'
const FIELDS = ['label', 'network', 'type', 'address', 'ensName'] as const
const NETWORK_OPTIONS = NETWORKS.map((value) => ({ value, label: NETWORK_LABELS[value] }))
const TYPE_OPTIONS = WALLET_TYPES.map((value) => ({ value, label: WALLET_TYPE_LABELS[value] }))

interface WalletFormProps {
  userId: string
  role: WalletRole
  wallet: Wallet | undefined
  /** Source of "Igual à carteira principal", on the secondary form. */
  template: Wallet | undefined
  onSaved: (message: string) => void
  onCancel?: (() => void) | undefined
}

export function WalletForm({ userId, role, wallet, template, onSaved, onCancel }: WalletFormProps) {
  const draftKey = `wallet.${userId}.${role}`
  const create = useCreateWallet()
  const update = useUpdateWallet(wallet?.id ?? '')
  const [restored] = useState(() => loadAccountDraft(draftKey))
  const submitting = useRef(false)
  const title = role === 'primary' ? 'principal' : 'secundária'
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    // The two empty selects fail validation until the user picks an option.
    defaultValues: wallet ?? { label: '', address: '', ensName: '' },
  })
  const values = useWatch({ control })

  useEffect(() => {
    if (restored) reset((current) => ({ ...current, ...restored }), { keepDefaultValues: true })
  }, [reset, restored])

  useEffect(() => {
    if (isDirty) {
      const { label = '', network = '', type = '', address = '', ensName = '' } = values
      saveAccountDraft(draftKey, { label, network, type, address, ensName })
    } else {
      clearAccountDraft(draftKey)
    }
  }, [draftKey, isDirty, values])

  async function save(input: WalletFormValues) {
    if (submitting.current) return
    submitting.current = true

    try {
      const result = await (wallet ? update.mutateAsync(input) : create.mutateAsync({ ...input, role }))
      reset(result)
      clearAccountDraft(draftKey)
      onSaved(`Carteira ${title} salva.`)
    } catch (error) {
      if (!isApiError(error, 'unauthorized')) applyApiErrors(error, FIELDS, setError)
    } finally {
      submitting.current = false
    }
  }

  return (
    <form
      noValidate
      aria-label={`Dados da carteira ${title}`}
      className="flex flex-col gap-5"
      onSubmit={(event) => void handleSubmit(save)(event)}
    >
      {role === 'secondary' && template && (
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            onChange={(event) => {
              if (!event.target.checked) return
              setValue('network', template.network, { shouldDirty: true })
              setValue('type', template.type, { shouldDirty: true })
            }}
          />
          Igual à carteira principal
        </label>
      )}
      <div className="grid gap-5 md:grid-cols-2 md:gap-x-7">
        <TextField
          showLabel
          required
          label="Apelido da carteira"
          className={FIELD}
          error={errors.label?.message}
          {...register('label')}
        />
        <SelectField
          required
          label="Rede"
          placeholder="Selecione uma rede"
          options={NETWORK_OPTIONS}
          error={errors.network?.message}
          {...register('network')}
        />
        <TextField
          showLabel
          required
          label="Endereço da carteira"
          placeholder="Endereço 0x da carteira"
          autoComplete="off"
          spellCheck={false}
          className={FIELD}
          error={errors.address?.message}
          {...register('address')}
        />
        <SelectField
          required
          label="Tipo de carteira"
          placeholder="Selecione uma carteira"
          options={TYPE_OPTIONS}
          error={errors.type?.message}
          {...register('type')}
        />
        <TextField
          showLabel
          label="Nome ENS (opcional)"
          placeholder="ENS ou carteira secundária (opcional)"
          className={FIELD}
          error={errors.ensName?.message}
          {...register('ensName')}
        />
      </div>
      {errors.root?.server && (
        <p role="alert" className="text-xs text-destructive">
          {errors.root.server.message}
        </p>
      )}
      <div className="flex flex-col gap-3 md:flex-row">
        <Button type="submit" disabled={!isDirty || isSubmitting} className="md:w-46">
          {isSubmitting ? 'Salvando...' : 'Salvar carteira'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
