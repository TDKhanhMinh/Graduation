"use client"

import { useEffect } from "react"
import { toast } from "sonner"

type ActionToastProps = {
  message: string
  variant?: "success" | "error"
  queryKey: string
}

export function ActionToast({ message, variant = "success", queryKey }: ActionToastProps) {
  useEffect(() => {
    if (variant === "error") toast.error(message)
    else toast.success(message)

    const url = new URL(window.location.href)
    url.searchParams.delete(queryKey)
    window.history.replaceState({}, "", url.toString())
  }, [message, queryKey, variant])

  return null
}
