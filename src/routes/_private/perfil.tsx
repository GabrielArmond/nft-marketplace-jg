import { createFileRoute } from '@tanstack/react-router'

import { ProfilePage } from '@/features/account/pages/profile-page'

export const Route = createFileRoute('/_private/perfil')({
  component: ProfilePage,
})
