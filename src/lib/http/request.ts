import type { AxiosRequestConfig } from 'axios'
import * as z from 'zod/mini'

import { ApiError } from '@/lib/http/api-error'
import { httpClient } from '@/lib/http/http-client'

export type RequestOptions = Pick<AxiosRequestConfig, 'signal'>

export const CONTRACT_VIOLATION_CODE = 'CONTRACT_VIOLATION'

/** Sends a request and validates the body: TypeScript alone cannot vouch for the network. */
export async function requestJson<Schema extends z.ZodMiniType>(
  schema: Schema,
  config: AxiosRequestConfig,
): Promise<z.output<Schema>> {
  const { data } = await httpClient.request<unknown>(config)
  const result = z.safeParse(schema, data)

  if (!result.success) {
    throw new ApiError({
      kind: 'unexpected',
      code: CONTRACT_VIOLATION_CODE,
      cause: result.error,
    })
  }
  return result.data
}

/** For 204 responses: there is no body to validate. */
export async function requestVoid(config: AxiosRequestConfig): Promise<void> {
  await httpClient.request<unknown>(config)
}
