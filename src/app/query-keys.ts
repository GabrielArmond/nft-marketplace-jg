/** Everything under this scope belongs to one user and is dropped when the session changes. */
export const PRIVATE_SCOPE = 'private'

export const queryKeys = {
  session: ['session'],
  cart: [PRIVATE_SCOPE, 'cart'],
} as const
