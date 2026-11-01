import type * as z from 'zod/mini'

import { API_ERROR_CODES, type ApiErrorEnvelope } from '@/contracts/common'

/** Thrown by the simulated server; `route` turns it into the error envelope. */
export class MockHttpError extends Error {
  readonly status: number
  readonly body: ApiErrorEnvelope

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.status = status
    this.body = { error: { code, message, ...(fieldErrors && { fieldErrors }) } }
  }
}

export function notFound(message = 'Recurso inexistente.'): MockHttpError {
  return new MockHttpError(404, API_ERROR_CODES.notFound, message)
}

export function invalidFields(
  fieldErrors: Record<string, string[]>,
  code: string = API_ERROR_CODES.validationFailed,
  message = 'Revise os dados informados.',
): MockHttpError {
  return new MockHttpError(422, code, message, fieldErrors)
}

export function fromZodError(error: z.core.$ZodError): MockHttpError {
  const fieldErrors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'body'
    ;(fieldErrors[field] ??= []).push(issue.message)
  }
  return invalidFields(fieldErrors)
}
