import { http, HttpResponse, type HttpHandler, type PathParams } from 'msw'
import * as z from 'zod/mini'

import { API_ERROR_CODES } from '@/contracts/common'
import { env } from '@/lib/env'
import { commit } from '@/mocks/db/store'
import { fromZodError, MockHttpError } from '@/mocks/domain/errors'
import { afterRequest, beforeRequest } from '@/mocks/engine/engine'

export const API_BASE_PATH = new URL(env.apiBaseUrl, window.location.origin).pathname.replace(
  /\/$/,
  '',
)

interface RouteContext {
  request: Request
  url: URL
  params: PathParams
}

type Resolver = (context: RouteContext) => Response | Promise<Response>
type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

export function param({ params }: RouteContext, name: string): string {
  const value = params[name]
  return typeof value === 'string' ? value : ''
}

export async function readBody<Schema extends z.ZodMiniType>(
  request: Request,
  schema: Schema,
): Promise<z.output<Schema>> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new MockHttpError(400, API_ERROR_CODES.validationFailed, 'Corpo da requisição inválido.')
  }

  const result = z.safeParse(schema, body)
  if (!result.success) throw fromZodError(result.error)
  return result.data
}

function errorResponse(error: MockHttpError): Response {
  return HttpResponse.json(error.body, { status: error.status })
}

/**
 * Every REST handler passes through here: scenario rules and latency run before
 * the resolver, the database is committed after it, and "answer lost" rules run
 * last, so a timed-out write really did happen.
 */
export function route(method: Method, path: string, resolver: Resolver): HttpHandler {
  return http[method](`${env.apiBaseUrl}${path}`, async ({ request, params }) => {
    const url = new URL(request.url)
    const info = { method: request.method, path: url.pathname.slice(API_BASE_PATH.length) }

    const early = await beforeRequest(info)
    if (early) return early

    let response: Response
    try {
      response = await resolver({ request, url, params })
    } catch (error) {
      if (!(error instanceof MockHttpError)) throw error
      commit()
      return errorResponse(error)
    }

    commit()
    return (await afterRequest(info)) ?? response
  })
}

export function noContent(): Response {
  return new HttpResponse(null, { status: 204 })
}
