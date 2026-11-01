import { useState } from 'react'

import { useApplyCoupon, useRemoveCoupon } from '@/features/cart/hooks'
import { normalizeApiError } from '@/lib/http/api-error'
import { showToast } from '@/lib/toast'

const ERROR_ID = 'cupom-erro'

export function CouponForm({ appliedCode }: { appliedCode: string | null }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const failure = apply.error ? normalizeApiError(apply.error) : null
  const error = failure && (failure.fieldErrors.code?.[0] ?? failure.message)

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>
          Cupom <strong>{appliedCode}</strong> aplicado
        </span>
        <button
          type="button"
          disabled={remove.isPending}
          className="text-content-accent underline-offset-4 hover:underline disabled:opacity-50"
          onClick={() => {
            remove.mutate(undefined)
          }}
        >
          Remover cupom
        </button>
      </div>
    )
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-1"
      onSubmit={(event) => {
        event.preventDefault()
        apply.mutate(code, {
          onSuccess: ({ couponCode }) => {
            setCode('')
            showToast(`Cupom ${couponCode ?? ''} aplicado.`)
          },
        })
      }}
    >
      <label htmlFor="cupom" className="hidden text-sm leading-4 font-bold md:mb-2 md:block">
        Código promocional
      </label>
      <div className="flex h-12.5 overflow-hidden rounded-pill border border-border focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring md:h-10 md:rounded-xs md:border-primary">
        <input
          id="cupom"
          value={code}
          aria-label="Código promocional"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? ERROR_ID : undefined}
          placeholder="Digite o código promocional..."
          className="min-w-0 flex-1 bg-transparent px-4 text-base outline-none placeholder:text-caption placeholder:text-content-subtle md:px-2 md:text-xs md:placeholder:text-xs"
          onChange={(event) => {
            setCode(event.target.value)
            apply.reset()
          }}
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className="w-24 shrink-0 rounded-pill bg-linear-135 from-primary/54 to-primary text-md font-bold text-foreground disabled:opacity-60 md:rounded-none md:bg-primary md:bg-none md:text-primary-foreground"
        >
          {apply.isPending ? '...' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={ERROR_ID} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
