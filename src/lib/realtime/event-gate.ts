import type { RealtimeEvent } from '@/contracts/events'

const MAX_REMEMBERED_IDS = 500

export interface EventGate {
  /** True only for the first delivery of a version newer than any seen for the resource. */
  accept: (event: RealtimeEvent) => boolean
  reset: () => void
}

/** Drops redeliveries by `id` and late arrivals by `version`. Use one per consumer. */
export function createEventGate(): EventGate {
  const seenIds = new Set<string>()
  const latestVersions = new Map<string, number>()

  return {
    accept({ id, resource, version }) {
      const resourceKey = `${resource.type}:${resource.id}`

      if (seenIds.has(id) || version <= (latestVersions.get(resourceKey) ?? 0)) return false

      seenIds.add(id)
      latestVersions.set(resourceKey, version)
      if (seenIds.size > MAX_REMEMBERED_IDS) {
        const [oldest] = seenIds
        if (oldest !== undefined) seenIds.delete(oldest)
      }
      return true
    },
    reset() {
      seenIds.clear()
      latestVersions.clear()
    },
  }
}
