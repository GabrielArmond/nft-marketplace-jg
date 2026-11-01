import { createFileRoute } from '@tanstack/react-router'

import { UnderConstruction } from '@/components/feedback/under-construction'

export const Route = createFileRoute('/_private/pagamento')({
  component: function CheckoutRoute() {
    return <UnderConstruction title="Pagamento" />
  },
})
