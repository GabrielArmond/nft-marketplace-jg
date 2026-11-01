import { useState, type ComponentProps } from 'react'

import { TextField } from '@/components/form/text-field'
import { HideIcon } from '@/components/icons/icons'
import { cn } from '@/lib/utils'

export function PasswordField(props: ComponentProps<typeof TextField>) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          className={cn(
            'flex size-8 items-center justify-center rounded-sm cursor-pointer',
            visible ? 'text-content-accent' : 'text-content-subtle',
          )}
          onClick={() => {
            setVisible((current) => !current)
          }}
        >
          <HideIcon className="h-5 w-5.75" />
        </button>
      }
    />
  )
}
