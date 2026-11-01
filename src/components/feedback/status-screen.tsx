import type { ReactNode } from 'react'

interface StatusScreenProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

/** Full-page outcome shared by the routing fallbacks (404 and unexpected errors). */
export function StatusScreen({ eyebrow, title, description, children }: StatusScreenProps) {
  return (
    <div className="page-container flex min-h-[60dvh] flex-col items-center justify-center gap-4 py-12 text-center">
      <p className="text-sm font-bold tracking-wide text-content-accent">{eyebrow}</p>
      <h1 className="text-2xl font-bold md:text-4xl">{title}</h1>
      <p className="max-w-prose text-sm text-content-secondary">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}
