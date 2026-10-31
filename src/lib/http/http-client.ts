import axios from 'axios'

import { env } from '@/lib/env'
import { normalizeApiError } from '@/lib/http/api-error'

/** Every REST call goes through this instance, so callers only ever see `ApiError`. */
export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: { Accept: 'application/json' },
  transitional: { clarifyTimeoutError: true },
})

httpClient.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(normalizeApiError(error)),
)
