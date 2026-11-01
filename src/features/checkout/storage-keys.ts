export const ATTEMPT_PREFIX = 'kurio.checkout.attempt.'
export const DRAFT_PREFIX = 'kurio.checkout.draft.'

/**
 * After an explicit logout. An expired session keeps everything, for the retake.
 * Separate from the storage module so the app shell does not load its schemas.
 */
export function clearCheckoutStorage(): void {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(ATTEMPT_PREFIX) || key.startsWith(DRAFT_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    }
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}
