import { API_ERROR_CODES } from '@/contracts/common'
import type { PaymentOutcome } from '@/mocks/db/types'

export type MockMutation = 'expire-session' | 'raise-cart-price' | 'sell-out-cart-edition'

export type FaultAction =
  | {
      kind: 'http'
      status: number
      code: string
      message: string
      fieldErrors?: Record<string, string[]>
    }
  | { kind: 'network' }
  /** Never answers, so the client hits its own timeout. */
  | { kind: 'hang' }
  /** Changes the simulated server and lets the request continue. */
  | { kind: 'mutate'; mutation: MockMutation }

/** Plain JSON on purpose: rules are persisted and sent through the control API. */
export interface FaultRule {
  id: string
  /** Any method when omitted. */
  method?: string
  /** Regular expression source, tested against the path after the API base. */
  path: string
  /** `after` runs once the write is committed: the work happens, the answer is lost. */
  phase: 'before' | 'after'
  /** Unlimited when omitted. */
  times?: number
  action: FaultAction
}

export type LatencyProfile =
  | { type: 'fixed'; ms: number }
  | { type: 'range'; minMs: number; maxMs: number }
  /** Alternates slow and fast on matching requests: the first one answers last. */
  | { type: 'out-of-order'; path: string; slowMs: number; fastMs: number }

export interface ScenarioFlags {
  emptyCatalog?: boolean
  socketDown?: boolean
  duplicateEvents?: boolean
  staleEvents?: boolean
}

export interface Scenario {
  id: string
  description: string
  latency: LatencyProfile
  rules: FaultRule[]
  payment: PaymentOutcome
  flags: ScenarioFlags
}

const ANY_PATH = '.*'
const CATALOG_PATH = '^/nfts'
const ORDERS_PATH = '^/orders$'
const PRIVATE_PATHS = '^/(cart|favorites|profile|wallets|orders|quotes)'
const DEFAULT_LATENCY: LatencyProfile = { type: 'fixed', ms: 120 }
const SLOW_MS = 3_000

function scenario(
  id: string,
  description: string,
  overrides: Partial<Omit<Scenario, 'id' | 'description'>> = {},
): Scenario {
  return {
    id,
    description,
    latency: DEFAULT_LATENCY,
    rules: [],
    payment: 'confirmed',
    flags: {},
    ...overrides,
  }
}

function httpScenario(status: number, code: string, message: string): Scenario {
  return scenario(`http-${status.toString()}`, `Toda chamada à API responde ${status.toString()}.`, {
    rules: [
      {
        id: 'http',
        path: ANY_PATH,
        phase: 'before',
        action: { kind: 'http', status, code, message },
      },
    ],
  })
}

const SCENARIOS: readonly Scenario[] = [
  scenario('default', 'Sucesso, com latência curta e pagamento confirmado.'),
  scenario('instant', 'Sucesso sem latência, para testes estáveis.', {
    latency: { type: 'fixed', ms: 0 },
  }),
  scenario('empty-catalog', 'Catálogo sem resultados.', { flags: { emptyCatalog: true } }),

  scenario('slow', 'Toda resposta leva 3 segundos.', {
    latency: { type: 'fixed', ms: SLOW_MS },
  }),
  scenario('variable-latency', 'Latência entre 100 ms e 2,5 s, reproduzível pela seed.', {
    latency: { type: 'range', minMs: 100, maxMs: 2_500 },
  }),
  scenario('out-of-order', 'Na listagem, a primeira resposta chega depois da segunda.', {
    latency: { type: 'out-of-order', path: CATALOG_PATH, slowMs: 1_500, fastMs: 100 },
  }),

  scenario('offline', 'Sem conexão: toda chamada falha na rede.', {
    rules: [{ id: 'network', path: ANY_PATH, phase: 'before', action: { kind: 'network' } }],
  }),
  scenario('flaky-connection', 'As duas primeiras leituras falham na rede e depois recupera.', {
    rules: [
      {
        id: 'network',
        method: 'GET',
        path: ANY_PATH,
        phase: 'before',
        times: 2,
        action: { kind: 'network' },
      },
    ],
  }),
  scenario('timeout', 'A listagem nunca responde: vale o timeout do cliente.', {
    rules: [{ id: 'hang', path: CATALOG_PATH, phase: 'before', action: { kind: 'hang' } }],
  }),

  httpScenario(400, API_ERROR_CODES.validationFailed, 'Requisição inválida.'),
  httpScenario(403, API_ERROR_CODES.forbidden, 'Acesso negado.'),
  httpScenario(404, API_ERROR_CODES.notFound, 'Recurso inexistente.'),
  httpScenario(429, API_ERROR_CODES.rateLimited, 'Muitas requisições.'),
  httpScenario(500, API_ERROR_CODES.serviceUnavailable, 'Falha interna.'),
  httpScenario(503, API_ERROR_CODES.serviceUnavailable, 'Serviço indisponível.'),

  scenario('session-expired', 'A sessão expira na primeira chamada privada.', {
    rules: [
      {
        id: 'expire',
        path: PRIVATE_PATHS,
        phase: 'before',
        times: 1,
        action: { kind: 'mutate', mutation: 'expire-session' },
      },
    ],
  }),
  scenario('session-expires-on-checkout', 'A sessão expira ao enviar o pedido.', {
    rules: [
      {
        id: 'expire',
        method: 'POST',
        path: ORDERS_PATH,
        phase: 'before',
        times: 1,
        action: { kind: 'mutate', mutation: 'expire-session' },
      },
    ],
  }),
  scenario('unauthorized-access', 'Todo recurso privado responde 403.', {
    rules: [
      {
        id: 'forbidden',
        path: PRIVATE_PATHS,
        phase: 'before',
        action: {
          kind: 'http',
          status: 403,
          code: API_ERROR_CODES.forbidden,
          message: 'Acesso negado.',
        },
      },
    ],
  }),

  scenario('register-conflict', 'O cadastro responde conflito de e-mail.', {
    rules: [
      {
        id: 'conflict',
        method: 'POST',
        path: '^/auth/register$',
        phase: 'before',
        action: {
          kind: 'http',
          status: 409,
          code: API_ERROR_CODES.emailTaken,
          message: 'Este e-mail já está cadastrado.',
          fieldErrors: { email: ['Este e-mail já está cadastrado.'] },
        },
      },
    ],
  }),
  scenario('profile-validation-error', 'O servidor recusa o perfil com erro por campo.', {
    rules: [
      {
        id: 'validation',
        method: 'PATCH',
        path: '^/profile$',
        phase: 'before',
        action: {
          kind: 'http',
          status: 422,
          code: API_ERROR_CODES.validationFailed,
          message: 'Revise os dados informados.',
          fieldErrors: { username: ['Este nome de usuário não é permitido.'] },
        },
      },
    ],
  }),

  scenario('price-changed-on-checkout', 'O preço sobe 10% ao enviar o pedido.', {
    rules: [
      {
        id: 'raise',
        method: 'POST',
        path: ORDERS_PATH,
        phase: 'before',
        times: 1,
        action: { kind: 'mutate', mutation: 'raise-cart-price' },
      },
    ],
  }),
  scenario('edition-sold-out-on-checkout', 'A edição esgota ao enviar o pedido.', {
    rules: [
      {
        id: 'sell-out',
        method: 'POST',
        path: ORDERS_PATH,
        phase: 'before',
        times: 1,
        action: { kind: 'mutate', mutation: 'sell-out-cart-edition' },
      },
    ],
  }),
  scenario('order-timeout-after-create', 'O pedido é criado, mas a resposta nunca chega.', {
    rules: [
      {
        id: 'hang',
        method: 'POST',
        path: ORDERS_PATH,
        phase: 'after',
        times: 1,
        action: { kind: 'hang' },
      },
    ],
  }),
  scenario('order-response-lost', 'O pedido é criado, mas a conexão cai antes da resposta.', {
    rules: [
      {
        id: 'network',
        method: 'POST',
        path: ORDERS_PATH,
        phase: 'after',
        times: 1,
        action: { kind: 'network' },
      },
    ],
  }),

  scenario('payment-refused', 'O pagamento é recusado.', { payment: 'refused' }),
  scenario('payment-pending', 'O pedido fica pendente até ser liquidado pela API de controle.', {
    payment: 'hold',
  }),
  scenario('wallet-refused', 'O usuário recusa a conexão na carteira.', {
    rules: [
      {
        id: 'refused',
        method: 'POST',
        path: '^/wallets/[^/]+/connect$',
        phase: 'before',
        action: {
          kind: 'http',
          status: 409,
          code: API_ERROR_CODES.walletRejected,
          message: 'A conexão foi recusada na carteira.',
        },
      },
    ],
  }),

  scenario('socket-down', 'O Socket.IO recusa conexões; o REST segue normal.', {
    flags: { socketDown: true },
  }),
  scenario('duplicate-events', 'Todo evento é entregue duas vezes.', {
    flags: { duplicateEvents: true },
  }),
  scenario('stale-events', 'Depois de cada evento chega de novo a versão anterior.', {
    flags: { staleEvents: true },
  }),
]

const BY_ID = new Map(SCENARIOS.map((item) => [item.id, item]))
const FALLBACK = scenario('default', 'Sucesso.')

export function findScenario(id: string): Scenario | undefined {
  return BY_ID.get(id)
}

export function resolveScenario(id: string): Scenario {
  return BY_ID.get(id) ?? FALLBACK
}

export function listScenarios(): { id: string; description: string }[] {
  return SCENARIOS.map(({ id, description }) => ({ id, description }))
}
