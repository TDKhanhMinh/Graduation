"use client"

import { useEffect, useState } from "react"

import { formatCountdown, type WelcomeCountdown } from "@/features/events/welcome"

type WelcomeCountdownProps = {
  target: string
  initialNow: string
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function getCountdown(target: string, now: string) {
  return formatCountdown(target, new Date(now))
}

export function WelcomeCountdown({ target, initialNow }: WelcomeCountdownProps) {
  const [countdown, setCountdown] = useState<WelcomeCountdown | null>(() => getCountdown(target, initialNow))

  useEffect(() => {
    let timer: number | null = null

    const stop = () => {
      if (timer === null) return
      window.clearInterval(timer)
      timer = null
    }

    const tick = () => {
      const next = formatCountdown(target, new Date())
      setCountdown(next)
      if (!next || next.totalMs <= 0) stop()
      return next
    }

    const start = () => {
      if (document.visibilityState !== "visible" || timer !== null) return
      const next = tick()
      if (!next || next.totalMs <= 0) return
      timer = window.setInterval(tick, 1000)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") start()
      else stop()
    }

    start()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [target])

  if (!countdown) return null

  if (countdown.totalMs <= 0) {
    return (
      <p
        aria-live="polite"
        aria-atomic="true"
        className="rounded-xl border border-status-success/25 bg-status-success/10 px-3 py-2 text-sm font-medium text-status-success"
        data-countdown-state="live"
        data-testid="welcome-countdown"
        data-tour-target="countdown"
        role="status"
      >
        Đang diễn ra
      </p>
    )
  }

  return (
    <div
      aria-label="Thời gian còn lại trước khi sự kiện bắt đầu"
      aria-live="polite"
      aria-atomic="true"
      className="grid min-h-16 w-fit grid-cols-4 gap-2 rounded-xl border border-[var(--event-border)] bg-[var(--event-surface)]/75 px-3 py-2"
      data-countdown-state="upcoming"
      data-testid="welcome-countdown"
      data-tour-target="countdown"
      role="status"
    >
      {[
        ["Ngày", countdown.days],
        ["Giờ", countdown.hours],
        ["Phút", countdown.minutes],
        ["Giây", countdown.seconds],
      ].map(([label, value]) => (
        <span className="flex min-w-12 flex-col items-center" key={label}>
          <span className="font-heading text-lg font-semibold tabular-nums" aria-hidden="true">
            {pad(Number(value))}
          </span>
          <span className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        </span>
      ))}
    </div>
  )
}
