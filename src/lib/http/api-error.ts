import { isAxiosError, isCancel } from 'axios'

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'transient'
  | 'canceled'
  | 'unexpected'

export type FieldErrors = Readonly<Record<string, readonly string[]>>

/** Failure envelope of the REST contract: `{ "error": { code, message, fieldErrors } }`. */
interface ApiErrorBody {
  code?: string
  message?: string
  fieldErrors?: FieldErrors
}

interface ApiErrorInit extends ApiErrorBody {
  kind: ApiErrorKind
  status?: number
  cause?: unknown
}

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  network: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
  timeout: 'O servidor demorou para responder. Tente novamente.',
  validation: 'Revise os dados informados.',
  unauthorized: 'Sua sessão expirou. Entre novamente para continuar.',
  forbidden: 'Você não tem permissão para realizar esta ação.',
  not_found: 'Não encontramos o que você procurava.',
  conflict: 'Esta informação mudou ou já está em uso. Revise e tente novamente.',
  transient: 'O serviço está temporariamente indisponível. Tente novamente em instantes.',
  canceled: 'A operação foi cancelada.',
  unexpected: 'Algo deu errado. Tente novamente.',
}

/** Server text is shown only where the contract makes it user-facing. */
const USER_FACING_SERVER_MESSAGE: ReadonlySet<ApiErrorKind> = new Set(['validation', 'conflict'])

/** Failures that may succeed on a new attempt. `conflict` and 4xx in general never do. */
const RETRYABLE: ReadonlySet<ApiErrorKind> = new Set(['network', 'timeout', 'transient'])

export class ApiError extends Error {
  override readonly name = 'ApiError'
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: string | null
  readonly fieldErrors: FieldErrors

  constructor({ kind, status, code, message, fieldErrors, cause }: ApiErrorInit) {
    const serverMessage = USER_FACING_SERVER_MESSAGE.has(kind) ? message : undefined
    super(serverMessage ?? DEFAULT_MESSAGES[kind], { cause })
    this.kind = kind
    this.status = status ?? null
    this.code = code ?? null
    this.fieldErrors = fieldErrors ?? {}
  }

  get isRetryable(): boolean {
    return RETRYABLE.has(this.kind)
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
    case 422:
      return 'validation'
    case 401:
      return 'unauthorized'
    case 403:
      return 'forbidden'
    case 404:
      return 'not_found'
    case 409:
      return 'conflict'
    case 408:
    case 425:
    case 429:
      return 'transient'
    default:
      return status >= 500 ? 'transient' : 'unexpected'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseFieldErrors(value: unknown): FieldErrors | undefined {
  if (!isRecord(value)) return undefined

  const entries = Object.entries(value).flatMap(([field, messages]) => {
    if (!Array.isArray(messages)) return []
    const texts = messages.filter((message): message is string => typeof message === 'string')
    return texts.length > 0 ? [[field, texts] as const] : []
  })
  return Object.fromEntries(entries)
}

/** Response bodies are external data: anything off-contract is simply ignored. */
function parseErrorBody(data: unknown): ApiErrorBody {
  if (!isRecord(data) || !isRecord(data.error)) return {}

  const { code, message, fieldErrors } = data.error
  const parsedFieldErrors = parseFieldErrors(fieldErrors)
  return {
    ...(typeof code === 'string' && { code }),
    ...(typeof message === 'string' && { message }),
    ...(parsedFieldErrors && { fieldErrors: parsedFieldErrors }),
  }
}

/** Converts any thrown value into an `ApiError`. Safe to call twice on the same error. */
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isCancel(error)) return new ApiError({ kind: 'canceled', cause: error })
  if (!isAxiosError(error)) return new ApiError({ kind: 'unexpected', cause: error })

  if (error.response) {
    const { status } = error.response
    const data: unknown = error.response.data
    return new ApiError({ ...parseErrorBody(data), kind: kindFromStatus(status), status, cause: error })
  }
  // Depends on `transitional.clarifyTimeoutError`, set in the HTTP client. Without
  // it Axios reports timeouts as ECONNABORTED, the same code as a browser abort.
  const kind = error.code === 'ETIMEDOUT' ? 'timeout' : 'network'
  return new ApiError({ kind, cause: error })
}

export function isApiError(error: unknown, kind?: ApiErrorKind): error is ApiError {
  return error instanceof ApiError && (kind === undefined || error.kind === kind)
}
