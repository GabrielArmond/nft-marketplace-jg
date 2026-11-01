import { useRef, useState } from 'react'

import { UserIcon } from '@/components/icons/icons'
import { Button } from '@/components/ui/button'
import { AVATAR_ACCEPT, toAvatarDataUrl } from '@/features/account/avatar-image'
import { useRemoveAvatar, useUpdateAvatar } from '@/features/account/hooks'
import { isApiError, normalizeApiError } from '@/lib/http/api-error'

export function AvatarField({ avatarUrl }: { avatarUrl: string | null }) {
  const input = useRef<HTMLInputElement>(null)
  const change = useRef<HTMLButtonElement>(null)
  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()
  const [message, setMessage] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const busy = update.isPending || remove.isPending

  function fail(error: unknown) {
    if (isApiError(error, 'unauthorized')) return
    setFailure(error instanceof Error && !isApiError(error) ? error.message : normalizeApiError(error).message)
  }

  async function onFile(file: File) {
    setMessage(null)
    setFailure(null)
    try {
      await update.mutateAsync(await toAvatarDataUrl(file))
      setMessage('Avatar atualizado.')
    } catch (error) {
      fail(error)
    }
  }

  async function onRemove() {
    setMessage(null)
    setFailure(null)
    try {
      await remove.mutateAsync()
      setMessage('Avatar removido.')
      // "Remover" is now disabled: without this the focus would fall to the body.
      requestAnimationFrame(() => {
        change.current?.focus()
      })
    } catch (error) {
      fail(error)
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <span id="avatar-rotulo" className="text-md leading-4">
        Avatar
      </span>
      <div className="flex items-center gap-6">
        <span className="flex size-12.5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-raised text-content-subtle">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar atual" className="size-full object-cover" />
          ) : (
            <UserIcon className="size-5" />
          )}
        </span>
        <input
          ref={input}
          type="file"
          accept={AVATAR_ACCEPT}
          aria-labelledby="avatar-rotulo"
          aria-describedby={failure ? 'avatar-erro' : undefined}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void onFile(file)
          }}
        />
        <Button
          ref={change}
          type="button"
          disabled={busy}
          onClick={() => {
            input.current?.click()
          }}
        >
          {avatarUrl ? 'Alterar' : 'Incluir'}
          <span className="sr-only"> avatar</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy || !avatarUrl}
          onClick={() => {
            void onRemove()
          }}
        >
          Remover<span className="sr-only"> avatar</span>
        </Button>
      </div>
      <p role="status" className="text-xs text-content-accent empty:hidden">
        {message}
      </p>
      {failure && (
        <p id="avatar-erro" role="alert" className="text-xs text-destructive">
          {failure}
        </p>
      )}
    </div>
  )
}
