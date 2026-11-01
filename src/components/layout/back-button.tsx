import { useCanGoBack, useRouter } from '@tanstack/react-router'

import { BackIcon } from '@/components/icons/icons'

/** Round back button of the mobile frames. Falls home on a page opened directly. */
export function BackButton() {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  return (
    <button
      type="button"
      aria-label="Voltar"
      className="flex size-8.75 items-center justify-center rounded-full border border-border bg-surface-raised text-content-secondary"
      onClick={() => {
        if (canGoBack) router.history.back()
        else void router.navigate({ to: '/' })
      }}
    >
      <BackIcon className="size-5" />
    </button>
  )
}
