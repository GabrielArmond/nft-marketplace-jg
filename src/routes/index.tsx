import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/features/catalog/pages/home-page'

export const Route = createFileRoute('/')({
  component: HomePage,
})
