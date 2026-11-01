import type { Socket } from 'socket.io-client'
import * as z from 'zod/mini'

import {
  NFT_UPDATED_EVENT,
  nftUpdatedEventSchema,
  ORDER_UPDATED_EVENT,
  orderUpdatedEventSchema,
  type ClientToServerEvents,
  type NftUpdatedEvent,
  type OrderUpdatedEvent,
  type ServerToClientEvents,
} from '@/contracts/events'
import { env } from '@/lib/env'

type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

const SOCKET_OPTIONS = {
  autoConnect: false,
  // WebSocket only: the mock transport does not implement HTTP long-polling.
  transports: ['websocket'],
  withCredentials: true,
}

const nftListeners = new Set<(event: NftUpdatedEvent) => void>()
const orderListeners = new Set<(event: OrderUpdatedEvent) => void>()
const connectListeners = new Set<() => void>()
const disconnectListeners = new Set<(reason: string) => void>()

let socket: RealtimeSocket | null = null
let loading: Promise<RealtimeSocket> | null = null
let shouldBeConnected = false

function dispatchValidated<Schema extends z.ZodMiniType>(
  event: keyof ServerToClientEvents,
  schema: Schema,
  listeners: ReadonlySet<(payload: z.output<Schema>) => void>,
) {
  return (payload: unknown) => {
    const result = z.safeParse(schema, payload)
    if (!result.success) {
      console.error(`Discarded malformed "${event}" event.`, result.error)
      return
    }
    for (const listener of listeners) listener(result.data)
  }
}

/**
 * Imported on demand, never at module level: engine.io-client keeps a reference to
 * `globalThis.WebSocket` when evaluated, so a static import would run before MSW
 * patches it and the mock would never see the connection. It also keeps the
 * library out of the main bundle.
 */
async function createSocket(): Promise<RealtimeSocket> {
  const { io } = await import('socket.io-client')
  const instance: RealtimeSocket = env.socketUrl
    ? io(env.socketUrl, SOCKET_OPTIONS)
    : io(SOCKET_OPTIONS)

  // A single listener per event: subscribers come and go without touching the socket.
  instance.on(
    NFT_UPDATED_EVENT,
    dispatchValidated(NFT_UPDATED_EVENT, nftUpdatedEventSchema, nftListeners),
  )
  instance.on(
    ORDER_UPDATED_EVENT,
    dispatchValidated(ORDER_UPDATED_EVENT, orderUpdatedEventSchema, orderListeners),
  )
  instance.on('connect', () => {
    for (const listener of connectListeners) listener()
  })
  instance.on('disconnect', (reason) => {
    for (const listener of disconnectListeners) listener(reason)
  })

  socket = instance
  return instance
}

export function connectRealtime(): void {
  shouldBeConnected = true
  loading ??= createSocket()

  loading.then(
    (instance) => {
      if (shouldBeConnected && !instance.active) instance.connect()
    },
    (error: unknown) => {
      loading = null
      console.error('Could not load the realtime client.', error)
    },
  )
}

export function disconnectRealtime(): void {
  shouldBeConnected = false
  socket?.disconnect()
}

/**
 * The server binds the connection to the session at handshake. Call this after
 * login, logout or a user switch so no event of the previous session arrives.
 */
export function restartRealtime(): void {
  disconnectRealtime()
  connectRealtime()
}

function subscribe<Listener>(listeners: Set<Listener>, listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Returns the function that removes the listener. */
export function onNftUpdated(listener: (event: NftUpdatedEvent) => void): () => void {
  return subscribe(nftListeners, listener)
}

/** Returns the function that removes the listener. */
export function onOrderUpdated(listener: (event: OrderUpdatedEvent) => void): () => void {
  return subscribe(orderListeners, listener)
}

/** Fires on every (re)connection: the moment to reconcile active resources with REST. */
export function onRealtimeConnect(listener: () => void): () => void {
  return subscribe(connectListeners, listener)
}

export function onRealtimeDisconnect(listener: (reason: string) => void): () => void {
  return subscribe(disconnectListeners, listener)
}

export function getRealtimeStatus(): RealtimeStatus {
  if (!socket) return loading ? 'connecting' : 'idle'
  if (socket.connected) return 'connected'
  return socket.active ? 'connecting' : 'disconnected'
}
