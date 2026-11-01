import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { queryKeys } from '@/app/query-keys'
import type { CreateOrderInput } from '@/contracts/orders'
import { createOrder } from '@/features/checkout/api'
import {
  clearAttempt,
  loadAttempt,
  saveAttempt,
  type OrderAttempt,
} from '@/features/checkout/attempt-storage'
import { isApiError, normalizeApiError, type ApiError } from '@/lib/http/api-error'

interface OrderAttemptOptions {
  userId: string
  /** The API answered that this attempt cannot go on: no order exists for it. */
  onRejected: (error: ApiError) => void
}

/**
 * Sends a purchase at most once. The attempt is stored before the request, so a
 * refresh or lost answer finds it: resending the same key and input returns the
 * same order. It is only dropped once the API has definitely refused it.
 */
export function useOrderAttempt({ userId, onRejected }: OrderAttemptOptions) {
  const queryClient = useQueryClient()
  const [attempt, setAttempt] = useState(() => loadAttempt(userId))
  const [failure, setFailure] = useState<string | null>(null)
  // State only changes on the next render: two quick clicks would both get through.
  const sending = useRef(false)
  const [isSending, setIsSending] = useState(false)
  const { mutateAsync } = useMutation({
    mutationFn: ({ input, key }: OrderAttempt) => createOrder(input, key),
  })

  async function send(current: OrderAttempt): Promise<void> {
    if (sending.current) return
    sending.current = true
    setIsSending(true)
    setFailure(null)

    try {
      const order = await mutateAsync(current)
      const placed = { ...current, orderId: order.id }

      saveAttempt(userId, placed)
      queryClient.setQueryData(queryKeys.order(order.id), order)
      void queryClient.invalidateQueries({ queryKey: queryKeys.orderList })
      setAttempt(placed)
    } catch (error) {
      const apiError = normalizeApiError(error)

      // Unknown outcome, or a lost session: only the same attempt can settle it.
      if (apiError.isRetryable) {
        setFailure(apiError.message)
      } else if (!isApiError(apiError, 'unauthorized')) {
        clearAttempt(userId)
        setAttempt(null)
        onRejected(apiError)
      }
    } finally {
      sending.current = false
      setIsSending(false)
    }
  }

  function start(input: CreateOrderInput): void {
    const created = { key: crypto.randomUUID(), input, orderId: null }

    saveAttempt(userId, created)
    setAttempt(created)
    void send(created)
  }

  function resume(): void {
    if (attempt) void send(attempt)
  }

  return { attempt, failure, isSending, start, resume }
}
