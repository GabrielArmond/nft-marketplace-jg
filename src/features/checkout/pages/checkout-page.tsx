import { zodResolver } from '@hookform/resolvers/zod'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { queryKeys } from '@/app/query-keys'
import { StatusScreen } from '@/components/feedback/status-screen'
import { SelectField } from '@/components/form/select-field'
import { TextField } from '@/components/form/text-field'
import { TextareaField } from '@/components/form/textarea-field'
import { BackButton } from '@/components/layout/back-button'
import { Button } from '@/components/ui/button'
import type { Profile, Wallet } from '@/contracts/account'
import type { Cart, Quote } from '@/contracts/cart'
import { API_ERROR_CODES, NETWORKS, type Network } from '@/contracts/common'
import { profileQueryOptions, walletsQueryOptions } from '@/features/account/queries'
import { useSession } from '@/features/auth/hooks'
import { CouponForm } from '@/features/cart/components/coupon-form'
import { cartQueryOptions } from '@/features/cart/queries'
import { NETWORK_LABELS } from '@/features/catalog/search-params'
import { loadAttempt, loadDraft, saveDraft } from '@/features/checkout/attempt-storage'
import { CheckoutSkeleton } from '@/features/checkout/components/checkout-skeleton'
import { OrderLines } from '@/features/checkout/components/order-lines'
import { QuoteChanges } from '@/features/checkout/components/quote-changes'
import { ReviewDialog } from '@/features/checkout/components/review-dialog'
import { TotalsList } from '@/features/checkout/components/totals-list'
import { WalletSection } from '@/features/checkout/components/wallet-section'
import {
  buildDefaults,
  checkoutFormSchema,
  ENS_SUFFIXES,
  toCollector,
  WALLET_TYPE_LABELS,
  walletForNetwork,
  type CheckoutFormValues,
} from '@/features/checkout/forms'
import { ordersQueryOptions, quoteQueryOptions } from '@/features/checkout/queries'
import { cartSignature, hasStockIssue, needsAcceptance } from '@/features/checkout/quote'
import { useOrderAttempt } from '@/features/checkout/use-order-attempt'
import { isApiError, normalizeApiError, type ApiError } from '@/lib/http/api-error'
import { formatEth } from '@/lib/money/eth'

const FORM_ID = 'checkout-form'
const FIELD = 'md:h-10 md:rounded-xs md:text-sm'
const NETWORK_OPTIONS = NETWORKS.map((value) => ({ value, label: NETWORK_LABELS[value] }))
const ENS_OPTIONS = ENS_SUFFIXES.map((value) => ({ value, label: value }))

function PageHeading() {
  return (
    <>
      <nav aria-label="Trilha" className="mb-8 hidden text-md leading-4 font-bold md:block">
        <Link to="/">Início</Link>
        {' / '}
        <Link to="/" hash="catalogo">
          Mercado
        </Link>
        {' / Pagamento'}
      </nav>
      <div className="mb-4 flex h-11 items-center gap-6 md:hidden">
        <BackButton />
        <h1 className="text-xl leading-4 font-bold">Pagamento com carteira</h1>
      </div>
      <h1 className="sr-only max-md:hidden">Pagamento com carteira</h1>
    </>
  )
}

interface CheckoutFormProps {
  userId: string
  cart: Cart
  profile: Profile
  wallets: readonly Wallet[]
}

function CheckoutForm({ userId, cart, profile, wallets }: CheckoutFormProps) {
  const queryClient = useQueryClient()
  const [accepted, setAccepted] = useState<Quote | null>(null)
  const [previous, setPrevious] = useState<Quote | null>(null)
  const [checking, setChecking] = useState(false)
  const [reviewing, setReviewing] = useState<CheckoutFormValues | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const submit = useRef<HTMLButtonElement>(null)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    setFocus,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: buildDefaults(profile, wallets, loadDraft(userId)),
  })
  const values = useWatch({ control })
  const network: Network = values.network ?? 'ethereum'
  const wallet = wallets.find(({ id }) => id === values.walletId)

  const signature = cartSignature(cart)
  const quoteOptions = quoteQueryOptions(network, signature)
  const hasItems = cart.items.length > 0
  const quoteQuery = useQuery({
    ...quoteOptions,
    enabled: hasItems,
    placeholderData: keepPreviousData,
  })
  const quote = quoteQuery.data
  const orders = useQuery(ordersQueryOptions)
  const pendingOrder = orders.data?.items.find(({ status }) => status === 'pending')

  const { attempt, failure, isSending, start, resume } = useOrderAttempt({
    userId,
    onRejected: handleRejected,
  })

  // Nothing to compare the first quote with: it becomes the reference, unless it has news.
  if (quote && !accepted && quote.issues.length === 0 && !quoteQuery.isPlaceholderData) {
    setAccepted(quote)
  }

  const changed = quote ? needsAcceptance(quote, accepted) : false
  const blocked = quote ? hasStockIssue(quote) : false
  // Not disabled while checking: the focus stays here, to return after the review.
  const canConfirm =
    Boolean(quote) &&
    !quoteQuery.isPlaceholderData &&
    !changed &&
    !blocked &&
    !attempt &&
    !pendingOrder

  useEffect(() => {
    saveDraft(userId, {
      displayName: values.displayName ?? '',
      username: values.username ?? '',
      profileName: values.profileName ?? '',
      email: values.email ?? '',
      network,
      walletId: values.walletId ?? '',
      ensLabel: values.ensLabel ?? '',
      referralCode: values.referralCode ?? '',
      note: values.note ?? '',
    })
  }, [network, userId, values])

  function refreshQuote(): Promise<Quote> {
    return queryClient.query({ ...quoteOptions, staleTime: 0 })
  }

  function handleRejected(error: ApiError) {
    const { code, message } = error

    setReviewing(null)
    setNotice(message)

    if (code === API_ERROR_CODES.walletNotConnected) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets })
      setError('walletId', { message })
      setFocus('walletId')
    } else if (code === API_ERROR_CODES.idempotencyKeyReused) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orderList })
    } else {
      // The quote fell behind: the API's new one replaces it before anything else happens.
      setPrevious(quote ?? null)
      setAccepted((current) => (current?.id === quote?.id ? null : current))
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
      refreshQuote().catch((refreshError: unknown) => {
        if (!isApiError(refreshError, 'unauthorized')) {
          setNotice(normalizeApiError(refreshError).message)
        }
      })
    }
    submit.current?.focus()
  }

  function selectWallet(next: Wallet) {
    setValue('walletId', next.id, { shouldDirty: true })
    setValue('network', next.network, { shouldDirty: true })
    clearErrors('walletId')
  }

  function changeNetwork(next: Network) {
    setValue('network', next, { shouldDirty: true })
    setValue('walletId', walletForNetwork(wallets, next)?.id ?? '', { shouldDirty: true })
    clearErrors('walletId')
  }

  async function startReview(formValues: CheckoutFormValues) {
    if (checking) return

    const chosen = wallets.find(({ id }) => id === formValues.walletId)

    if (!chosen?.connected) {
      setError('walletId', { message: 'Conecte a carteira para continuar.' })
      setFocus('walletId')
      return
    }

    setNotice(null)
    setChecking(true)
    try {
      const fresh = await refreshQuote()
      if (!needsAcceptance(fresh, accepted) && !hasStockIssue(fresh)) setReviewing(formValues)
    } catch (error) {
      if (!isApiError(error, 'unauthorized')) setNotice(normalizeApiError(error).message)
    } finally {
      setChecking(false)
    }
  }

  const walletField = register('walletId')
  const otherWallet = wallets.find(({ id }) => id !== values.walletId)
  const usesOtherWallet = wallet ? wallet.role !== 'primary' : false

  if (attempt?.orderId) {
    return <Navigate replace to="/pedido/$id" params={{ id: attempt.orderId }} />
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_25.3125rem]">
      <form
        id={FORM_ID}
        noValidate
        aria-labelledby="perfil-titulo"
        className="flex min-w-0 flex-col gap-3"
        onSubmit={(event) => void handleSubmit(startReview)(event)}
      >
        <h2 id="perfil-titulo" className="text-lg leading-4 font-bold">
          Perfil do colecionador
        </h2>
        <div className="grid gap-3 md:grid-cols-2 md:gap-x-6">
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
          <SelectField
            required
            label="Rede"
            options={NETWORK_OPTIONS}
            error={errors.network?.message}
            {...register('network', {
              onChange: (event: { target: { value: Network } }) => {
                changeNetwork(event.target.value)
              },
            })}
          />
          <TextField
            showLabel
            required
            label="Nome do perfil"
            className={FIELD}
            error={errors.profileName?.message}
            {...register('profileName')}
          />
          <TextField
            showLabel
            readOnly
            required
            label="Endereço da carteira"
            placeholder="Endereço 0x da carteira"
            value={wallet?.address ?? ''}
            className={FIELD}
          />
          <TextField
            showLabel
            label="ENS ou carteira secundária (opcional)"
            placeholder="ENS ou carteira secundária (opcional)"
            className={FIELD}
            error={errors.ensLabel?.message}
            {...register('ensLabel')}
          />
          <TextField
            showLabel
            readOnly
            required
            label="Tipo de carteira"
            placeholder="Selecione uma carteira"
            value={wallet ? WALLET_TYPE_LABELS[wallet.type] : ''}
            className={FIELD}
          />
          <TextField
            showLabel
            label="Código de indicação (opcional)"
            className={FIELD}
            error={errors.referralCode?.message}
            {...register('referralCode')}
          />
          <TextField
            showLabel
            required
            type="email"
            label="E-mail"
            autoComplete="email"
            className={FIELD}
            error={errors.email?.message}
            {...register('email')}
          />
          <div className="md:w-23">
            <SelectField
              required
              label="Nome ENS"
              options={ENS_OPTIONS}
              {...register('ensSuffix')}
            />
          </div>
        </div>

        {otherWallet && (
          <label className="flex items-center gap-2 text-md">
            <input
              type="checkbox"
              checked={usesOtherWallet}
              className="size-4 accent-primary"
              onChange={() => {
                selectWallet(otherWallet)
              }}
            />
            Usar outra carteira?
          </label>
        )}

        <div className="md:w-87.5">
          <TextareaField
            label="Observação do colecionador (opcional)"
            error={errors.note?.message}
            {...register('note')}
          />
        </div>
      </form>

      <section aria-labelledby="resumo-titulo" className="flex min-w-0 flex-col gap-3">
        <h2 id="resumo-titulo" className="text-lg leading-4 font-bold">
          Seus NFTs
        </h2>
        <div
          aria-hidden="true"
          className="flex justify-between border-b border-primary pb-3 text-base leading-4 font-bold"
        >
          <span>NFTs</span>
          <span className="font-medium">Subtotal</span>
        </div>

        {quote && <OrderLines lines={quote.lines} />}
        {!quote && hasItems && (
          <p role="status" className="text-sm text-content-secondary">
            Calculando sua cotação...
          </p>
        )}

        <CouponForm appliedCode={cart.couponCode} />

        {quote && <TotalsList totals={quote} />}
        <p className="text-xs text-content-accent">Taxa estimada</p>

        {quoteQuery.error && !isApiError(quoteQuery.error, 'unauthorized') && (
          <div role="alert" className="flex items-center justify-between gap-3 text-sm">
            <span>{normalizeApiError(quoteQuery.error).message}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => {
                void quoteQuery.refetch()
              }}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {quote && changed && (
          <QuoteChanges
            quote={quote}
            previous={previous ?? accepted}
            onAccept={() => {
              setAccepted(quote)
              setPrevious(null)
              setNotice(null)
            }}
          />
        )}

        {quote && blocked && !changed && (
          <div role="alert" className="flex flex-col gap-2 text-sm">
            <p>{quote.issues.find(({ type }) => type === 'insufficient_availability')?.message}</p>
            <Link to="/carrinho" className="text-content-accent underline">
              Ajustar carrinho
            </Link>
          </div>
        )}

        <WalletSection
          wallets={wallets}
          selectedId={values.walletId ?? ''}
          error={errors.walletId?.message}
          radioProps={walletField}
          onSelect={selectWallet}
        />
        {!wallet && (
          <p className="text-sm text-content-secondary">
            Nenhuma carteira selecionada para a rede {NETWORK_LABELS[network]}.
          </p>
        )}

        <p role="status" className="text-sm text-content-accent empty:hidden">
          {notice}
        </p>

        {pendingOrder && !attempt && (
          <div role="alert" className="flex flex-col gap-2 text-sm">
            <p>O pedido {pendingOrder.number} ainda está em processamento.</p>
            <Link
              to="/pedido/$id"
              params={{ id: pendingOrder.id }}
              className="text-content-accent underline"
            >
              Acompanhar pedido
            </Link>
          </div>
        )}

        {attempt && (
          <div role="alert" className="flex flex-col gap-2 rounded-xs border border-primary p-3">
            <p className="text-sm font-bold">Sua compra ainda não foi concluída</p>
            <p className="text-sm">
              {failure ?? 'Encontramos uma tentativa em andamento.'} Retomar usa a mesma tentativa e
              não cria outra compra.
            </p>
            <Button
              type="button"
              size="sm"
              disabled={isSending}
              className="self-start text-sm"
              onClick={resume}
            >
              {isSending ? 'Retomando...' : 'Retomar compra'}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-end gap-7 md:hidden">
          <span className="text-base leading-4 font-bold">Total:</span>
          <span className="text-lg leading-4 font-bold text-content-accent">
            {quote ? `${formatEth(quote.totalEth)} ETH` : '...'}
          </span>
        </div>

        <Button
          ref={submit}
          type="submit"
          form={FORM_ID}
          variant="gradient"
          size="cta"
          disabled={!canConfirm}
          className="w-full md:h-11.25 md:rounded-control md:bg-primary md:bg-none"
        >
          {checking ? 'Verificando valores...' : 'Confirmar compra'}
        </Button>
      </section>

      {reviewing && quote && wallet && !changed && (!attempt || isSending) && (
        <ReviewDialog
          quote={quote}
          wallet={wallet}
          collector={toCollector(reviewing)}
          sending={isSending}
          returnFocusTo={submit}
          onClose={() => {
            setReviewing(null)
          }}
          onConfirm={() => {
            start({
              quoteId: quote.id,
              walletId: wallet.id,
              network: quote.network,
              collector: toCollector(reviewing),
            })
          }}
        />
      )}
    </div>
  )
}

export function CheckoutPage() {
  const { data: session } = useSession()
  const cart = useQuery(cartQueryOptions)
  const profile = useQuery(profileQueryOptions)
  const wallets = useQuery(walletsQueryOptions)
  const failed = [cart, profile, wallets].find(({ error, data }) => error && !data)

  if (failed?.error) {
    return (
      <StatusScreen
        eyebrow="Erro"
        title="Não foi possível carregar o pagamento"
        description={normalizeApiError(failed.error).message}
      >
        <Button
          size="lg"
          disabled={failed.isFetching}
          onClick={() => {
            void cart.refetch()
            void profile.refetch()
            void wallets.refetch()
          }}
        >
          {failed.isFetching ? 'Tentando...' : 'Tentar novamente'}
        </Button>
      </StatusScreen>
    )
  }

  if (!session || !cart.data || !profile.data || !wallets.data) return <CheckoutSkeleton />

  return (
    <CheckoutGate
      userId={session.user.id}
      cart={cart.data}
      profile={profile.data}
      wallets={wallets.data.items}
    />
  )
}

function CheckoutGate({ userId, cart, profile, wallets }: CheckoutFormProps) {
  const saved = loadAttempt(userId)

  // An order already exists for this attempt: its page is the only way forward.
  if (saved?.orderId) return <Navigate replace to="/pedido/$id" params={{ id: saved.orderId }} />

  // With an open attempt, an emptied cart may mean the purchase went through: only
  // resuming tells, so the attempt must stay on screen.
  if (cart.items.length === 0 && !saved) {
    return (
      <StatusScreen
        eyebrow="Pagamento"
        title="Seu carrinho está vazio"
        description="Adicione NFTs ao carrinho para finalizar uma compra."
      >
        <Button asChild size="lg">
          <Link to="/" hash="catalogo">
            Explorar o catálogo
          </Link>
        </Button>
      </StatusScreen>
    )
  }

  return (
    <div className="pt-8 pb-10 page-container">
      <PageHeading />
      <CheckoutForm
        key={userId}
        userId={userId}
        cart={cart}
        profile={profile}
        wallets={wallets}
      />
    </div>
  )
}
