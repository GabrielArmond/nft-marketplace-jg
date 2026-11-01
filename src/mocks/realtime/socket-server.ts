import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws, type WebSocketHandler } from 'msw'

import { env } from '@/lib/env'
import { getDb } from '@/mocks/db/store'
import { currentUserId } from '@/mocks/domain/auth'
import { setEventTransport, type Delivery } from '@/mocks/domain/events'
import { resolveScenario } from '@/mocks/engine/scenarios'

const SOCKET_IO_PATH = '/socket.io/'
/** Engine.IO asks the server to ping; the binding does not, so the client would drop at ~30s. */
const PING_INTERVAL_MS = 20_000
const ENGINE_IO_PING = '2'
/** Application range: the client treats it as a lost connection and retries. */
const SERVICE_RESTART_CODE = 4_000

interface Connection {
  userId: string | null
  close: () => void
  emit: (delivery: Delivery) => void
}

const connections = new Set<Connection>()

/**
 * Matches the origin root on purpose: MSW strips `/socket.io/` from the client URL
 * before comparing, so a pattern containing that path never matches.
 */
function socketUrlPattern(): RegExp {
  const { host } = new URL(env.socketUrl ?? window.location.origin)
  return new RegExp(`^wss?://${host.replaceAll('.', '\\.')}/$`)
}

function isSocketDown(): boolean {
  const { socketDown, scenarioId } = getDb().runtime
  return socketDown || resolveScenario(scenarioId).flags.socketDown === true
}

/** Private events go only to the connection authenticated as their owner. */
function canReceive({ userId }: Connection, { audienceUserId }: Delivery): boolean {
  return audienceUserId === null || audienceUserId === userId
}

function broadcast(delivery: Delivery): void {
  if (isSocketDown()) return

  for (const connection of connections) {
    if (canReceive(connection, delivery)) connection.emit(delivery)
  }
}

export function closeAllConnections(): void {
  for (const connection of connections) connection.close()
}

export function countConnections(): number {
  return connections.size
}

export function createSocketHandler(): WebSocketHandler {
  setEventTransport(broadcast)

  return ws.link(socketUrlPattern()).addEventListener('connection', (socket) => {
    const { client, server } = socket

    // The root pattern also catches Vite's HMR socket: let it reach the dev server.
    if (!client.url.pathname.startsWith(SOCKET_IO_PATH)) {
      server.connect()
      return
    }

    if (isSocketDown()) {
      client.close(SERVICE_RESTART_CODE, 'unavailable')
      return
    }

    const io = toSocketIo(socket)
    const ping = setInterval(() => {
      client.send(ENGINE_IO_PING)
    }, PING_INTERVAL_MS)

    const connection: Connection = {
      // Bound at handshake, like a server reading the session cookie on upgrade.
      userId: currentUserId(),
      close: () => {
        client.close(SERVICE_RESTART_CODE, 'closed by the simulation')
      },
      emit: ({ event }) => {
        io.client.emit(event.type, event)
      },
    }

    connections.add(connection)
    client.addEventListener('close', () => {
      clearInterval(ping)
      connections.delete(connection)
    })
  })
}
