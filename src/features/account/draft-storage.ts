const PREFIX = 'kurio.account.draft.'

export type AccountDraft = Readonly<Record<string, string>>

function isDraft(value: unknown): value is AccountDraft {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((field) => typeof field === 'string')
  )
}

/**
 * Unsaved text, so a session that expires mid-edit can be picked up after login.
 * Only ever called with non-sensitive fields: passwords never reach storage.
 */
export function loadAccountDraft(key: string): AccountDraft | null {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    return isDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveAccountDraft(key: string, draft: AccountDraft): void {
  try {
    sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(draft))
  } catch {
    // Without storage the form still works; it only loses the recovery.
  }
}

export function clearAccountDraft(key: string): void {
  try {
    sessionStorage.removeItem(`${PREFIX}${key}`)
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

/** After an explicit logout. An expired session keeps them, for the retake. */
export function clearAccountDrafts(): void {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(PREFIX)) sessionStorage.removeItem(key)
    }
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}
