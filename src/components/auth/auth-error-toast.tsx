"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function AuthErrorToast({ error }: { error: string }) {
  useEffect(() => {
    if (error) {
      toast.error(error)
      // Remove error from URL so it doesn't trigger again on refresh
      const url = new URL(window.location.href)
      url.searchParams.delete("error")
      window.history.replaceState({}, "", url.toString())
    }
  }, [error])
  
  return null
}
