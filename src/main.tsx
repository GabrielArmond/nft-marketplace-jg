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

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
