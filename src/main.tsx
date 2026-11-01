import '@fontsource-variable/roboto-mono/wght.css'
import '@/styles/globals.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found in index.html.')

/**
 * The env comparison must stay literal here: it is replaced at build time, which
 * lets the bundler drop this import and ship no mock code when mocks are off.
 */
async function startMocks(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { enableMocks } = await import('@/mocks/browser')
    await enableMocks()
  }
}

function render(rootElement: HTMLElement): void {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

startMocks()
  .catch((error: unknown) => {
    console.error('Could not start the mock layer: API calls will fail.', error)
  })
  .finally(() => {
    render(container)
  })
