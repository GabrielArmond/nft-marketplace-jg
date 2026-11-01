type Listener = () => void

const listeners = new Set<Listener>()

/** Lets the query layer report a lost session without depending on the router. */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function reportSessionExpired(): void {
  for (const listener of listeners) listener()
}
