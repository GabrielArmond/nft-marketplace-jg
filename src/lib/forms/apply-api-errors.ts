import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'

import { normalizeApiError } from '@/lib/http/api-error'

/** Maps a failed submit onto the form: per field when the API says which, otherwise globally. */
export function applyApiErrors<Values extends FieldValues>(
  error: unknown,
  fields: readonly FieldPath<Values>[],
  setError: UseFormSetError<Values>,
): void {
  const { fieldErrors, message } = normalizeApiError(error)
  let shownOnField = false

  for (const field of fields) {
    const [first] = fieldErrors[field] ?? []
    if (first) {
      setError(field, { type: 'server', message: first })
      shownOnField = true
    }
  }

  if (!shownOnField) setError('root.server', { type: 'server', message })
}
