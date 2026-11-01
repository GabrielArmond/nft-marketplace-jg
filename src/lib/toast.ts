export interface Toast {
  id: number
  message: string
  tone: 'info' | 'error'
}

const DISMISS_AFTER_MS = 6_000

let toasts: readonly Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function publish(next: readonly Toast[]): void {
  toasts = next
  for (const listener of listeners) listener()
}

/** Mutation feedback from anywhere, including code that runs outside React. */
export function showToast(message: string, tone: Toast['tone'] = 'info'): void {
  const id = nextId
  nextId += 1
  publish([...toasts, { id, message, tone }])

  setTimeout(() => {
    publish(toasts.filter((toast) => toast.id !== id))
  }, DISMISS_AFTER_MS)
}

export function subscribeToToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getToasts(): readonly Toast[] {
  return toasts
}
