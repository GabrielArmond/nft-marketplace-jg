const DEFAULT_API_BASE_URL = '/api'
const DEFAULT_API_TIMEOUT_MS = 10_000

function parseTimeout(value: string | undefined): number {
  const raw = value?.trim()
  if (!raw) return DEFAULT_API_TIMEOUT_MS

  const timeout = Number(raw)
  if (!Number.isInteger(timeout) || timeout <= 0) {
    throw new Error(`VITE_API_TIMEOUT_MS must be a positive integer, received "${raw}".`)
  }
  return timeout
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
  apiTimeoutMs: parseTimeout(import.meta.env.VITE_API_TIMEOUT_MS),
} as const
