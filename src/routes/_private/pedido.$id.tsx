import { createFileRoute } from '@tanstack/react-router'

import { OrderPage } from '@/features/checkout/pages/order-page'

export const Route = createFileRoute('/_private/pedido/$id')({
  component: function OrderRoute() {
    const { id } = Route.useParams()
    // A new order must not inherit the state of the previous one.
    return <OrderPage key={id} id={id} />
  },
})
