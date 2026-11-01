import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { queryKeys } from '@/app/query-keys'
import { StatusScreen } from '@/components/feedback/status-screen'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks'
import { clearAttempt, clearDraft, loadAttempt } from '@/features/checkout/attempt-storage'
import { OrderSkeleton } from '@/features/checkout/components/checkout-skeleton'
import { Receipt } from '@/features/checkout/components/receipt'
import { orderQueryOptions } from '@/features/checkout/queries'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'

function CatalogLink() {
  return (
    <Button asChild size="lg">
      <Link to="/" hash="catalogo">
        Voltar ao catálogo
      </Link>
    </Button>
  )
}

export function OrderPage({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user.id
  const { data: order, error, isFetching, refetch } = useQuery(orderQueryOptions(id))
  const status = order?.status

  // Idempotent: reopening a settled order or a repeated status changes nothing.
  useEffect(() => {
    if (!userId || !status || status === 'pending') return

    if (loadAttempt(userId)?.orderId === id) {
      clearAttempt(userId)
      if (status === 'confirmed') clearDraft(userId)
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
    void queryClient.invalidateQueries({ queryKey: queryKeys.orderList })
  }, [id, queryClient, status, userId])

  if (error && !order) {
    if (isApiError(error, 'not_found')) {
      return (
        <StatusScreen
          eyebrow="Pedido"
          title="Pedido não encontrado"
          description="Confira o link. Nenhuma compra foi feita a partir desta página."
        >
          <CatalogLink />
        </StatusScreen>
      )
    }
    if (isApiError(error, 'forbidden')) {
      return (
        <StatusScreen
          eyebrow="Pedido"
          title="Este pedido é de outra conta"
          description="Entre com a conta que fez a compra para ver os detalhes."
        >
          <CatalogLink />
        </StatusScreen>
      )
    }
    return (
      <StatusScreen
        eyebrow="Erro"
        title="Não foi possível carregar o pedido"
        description={normalizeApiError(error).message}
      >
        <Button
          size="lg"
          disabled={isFetching}
          onClick={() => {
            void refetch()
          }}
        >
          {isFetching ? 'Tentando...' : 'Tentar novamente'}
        </Button>
      </StatusScreen>
    )
  }

  if (!order) return <OrderSkeleton />

  if (order.status === 'confirmed' && order.receipt) return <Receipt receipt={order.receipt} />

  if (order.status === 'refused') {
    return (
      <div role="alert">
        <StatusScreen
          eyebrow={`Pedido ${order.number}`}
          title="Pagamento recusado"
          description={`${order.refusalReason ?? 'A carteira recusou o pagamento.'} Nada foi cobrado e seus itens continuam no carrinho.`}
        >
          <Button asChild size="lg">
            <Link to="/pagamento">Voltar ao pagamento</Link>
          </Button>
        </StatusScreen>
      </div>
    )
  }

  // Also covers a confirmation whose receipt is still on its way.
  return (
    <div role="status">
      <StatusScreen
        eyebrow={`Pedido ${order.number}`}
        title="Pagamento em processamento"
        description="Estamos aguardando a confirmação da rede. Você pode sair desta página: o pedido continua sendo processado e nenhuma outra compra será criada."
      >
        <Button
          variant="outline"
          size="lg"
          disabled={isFetching}
          onClick={() => {
            void refetch()
          }}
        >
          {isFetching ? 'Atualizando...' : 'Atualizar status'}
        </Button>
      </StatusScreen>
    </div>
  )
}
