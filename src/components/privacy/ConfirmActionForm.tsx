"use client"

import type { ReactNode } from "react"

export function ConfirmActionForm({
  action,
  message,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>
  message: string
  children: ReactNode
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault()
      }}
    >
      {children}
    </form>
  )
}