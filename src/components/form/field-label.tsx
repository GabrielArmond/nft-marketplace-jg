import type { ReactNode } from 'react'

interface FieldLabelProps {
  htmlFor: string
  visible: boolean
  required?: boolean | undefined
  children: ReactNode
}

export function FieldLabel({ htmlFor, visible, required = false, children }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={visible ? 'text-md leading-6' : 'sr-only'}>
      {children}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-content-coral">
          *
        </span>
      )}
    </label>
  )
}
