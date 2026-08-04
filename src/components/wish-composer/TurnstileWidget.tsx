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

export function TurnstileWidget({ siteKey, resetKey, onTokenChange }: Props) {
  const [scriptReady, setScriptReady] = useState(false)
  const [scriptError, setScriptError] = useState(false)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!scriptReady || !container || !window.turnstile || !siteKey) return

    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      action: "submit_wish",
      theme: "auto",
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(null),
      "error-callback": () => {
        onTokenChange(null)
        setScriptError(true)
      },
    })

    return () => {
      window.turnstile?.remove(widgetId)
      onTokenChange(null)
    }
  }, [container, onTokenChange, resetKey, scriptReady, siteKey])

  if (!siteKey) {
    return (
      <p className="text-sm text-status-danger" role="alert">
        CAPTCHA chưa được cấu hình. Vui lòng thử lại sau.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Script
        id="turnstile-api"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => {
          setScriptError(false)
          setScriptReady(true)
        }}
        onError={() => {
          setScriptError(true)
          setScriptReady(false)
          onTokenChange(null)
        }}
      />
      <div ref={setContainer} className="min-h-16" aria-label="Xác minh CAPTCHA" />
      {scriptError ? (
        <p className="text-sm text-status-danger" role="alert">
          Không thể tải CAPTCHA. Vui lòng kiểm tra kết nối và thử lại.
        </p>
      ) : !scriptReady ? (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Đang tải bước xác minh…
        </p>
      ) : null}
    </div>
  )
}