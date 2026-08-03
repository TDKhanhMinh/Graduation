"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

type TurnstileOptions = {
  sitekey: string
  action: string
  theme: "auto"
  callback: (token: string) => void
  "expired-callback": () => void
  "error-callback": () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string
      remove: (widgetId: string) => void
    }
  }
}

type Props = {
  siteKey: string
  resetKey: number
  onTokenChange: (token: string | null) => void
}

export function TurnstileWidget({
  siteKey,
  resetKey,
  onTokenChange,
}: Props) {
  const [scriptReady, setScriptReady] = useState(false)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!scriptReady || !container || !window.turnstile || !siteKey) return

    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      action: "submit_wish",
      theme: "auto",
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(null),
      "error-callback": () => onTokenChange(null),
    })

    return () => {
      window.turnstile?.remove(widgetId)
      onTokenChange(null)
    }
  }, [container, onTokenChange, resetKey, scriptReady, siteKey])

  if (!siteKey) {
    return (
      <p className="text-sm text-destructive" role="alert">
        CAPTCHA chưa được cấu hình. Vui lòng thử lại sau.
      </p>
    )
  }

  return (
    <>
      <Script
        id="turnstile-api"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setScriptReady(false)}
      />
      <div
        ref={setContainer}
        className="min-h-[65px]"
        aria-label="Xác minh CAPTCHA"
      />
    </>
  )
}
