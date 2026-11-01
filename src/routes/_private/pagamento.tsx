import { createFileRoute } from '@tanstack/react-router'

import { CheckoutPage } from '@/features/checkout/pages/checkout-page'

export const Route = createFileRoute('/_private/pagamento')({
  component: CheckoutPage,
})
