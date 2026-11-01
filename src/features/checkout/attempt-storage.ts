import * as z from 'zod/mini'

import { createOrderInputSchema } from '@/contracts/orders'
import { ATTEMPT_PREFIX, DRAFT_PREFIX } from '@/features/checkout/storage-keys'

const attemptSchema = z.object({
  key: z.string(),
  input: createOrderInputSchema,
  /** `null` until the API answers: the order may or may not exist yet. */
  orderId: z.nullable(z.string()),
})
/**
 * One purchase attempt. Key and input are stored together, because a retry must
 * repeat both for the API to answer with the same order.
 */
export type OrderAttempt = z.infer<typeof attemptSchema>

const draftSchema = z.record(z.string(), z.string())
export type CheckoutDraft = z.infer<typeof draftSchema>

/** Storage can be unavailable or hold anything: both simply mean "nothing saved". */
function read<Schema extends z.ZodMiniType>(key: string, schema: Schema): z.output<Schema> | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw === null) return null

    const result = z.safeParse(schema, JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Without storage the checkout still works; it only loses refresh recovery.
  }
}

function remove(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

export function loadAttempt(userId: string): OrderAttempt | null {
  return read(`${ATTEMPT_PREFIX}${userId}`, attemptSchema)
}

export function saveAttempt(userId: string, attempt: OrderAttempt): void {
  write(`${ATTEMPT_PREFIX}${userId}`, attempt)
}

export function clearAttempt(userId: string): void {
  remove(`${ATTEMPT_PREFIX}${userId}`)
}

export function loadDraft(userId: string): CheckoutDraft | null {
  return read(`${DRAFT_PREFIX}${userId}`, draftSchema)
}

export function saveDraft(userId: string, draft: CheckoutDraft): void {
  write(`${DRAFT_PREFIX}${userId}`, draft)
}

export function clearDraft(userId: string): void {
  remove(`${DRAFT_PREFIX}${userId}`)
}
