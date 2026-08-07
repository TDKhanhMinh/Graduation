"use client"

import { CalendarDays, Compass, MailOpen, Music, Music2, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { formatWelcomeDate, type AudioStatus, type WelcomeStage } from "@/features/events/welcome"
import { cn } from "@/lib/utils"

import { PosterMedia } from "./poster-media"
import { WelcomeCountdown } from "./welcome-countdown"

export type WelcomeSplashModalProps = {
  isOpen: boolean
  stage: WelcomeStage
  title: string
  coverUrl: string | null
  eventDate: string | null
  description: string | null
  reducedMotion?: boolean
  audioStatus?: AudioStatus
  onOpenEnvelope?: () => void
  onOpeningComplete?: () => void
  onClose?: () => void
  onSendWish?: () => void
  onExploreEvent?: () => void
  onToggleAudio?: () => void
}

export function WelcomeSplashModal({
  isOpen,
  stage,
  title,
  coverUrl,
  eventDate,
  description,
  reducedMotion = false,
  audioStatus = "idle",
  onOpenEnvelope,
  onOpeningComplete,
  onClose,
  onSendWish,
  onExploreEvent,
  onToggleAudio,
}: WelcomeSplashModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [initialNow] = useState(() => new Date().toISOString())

  const isVisible = isOpen && stage !== "closed" && stage !== "dismissed" && stage !== "checking"
  const isEnvelopeOpen = stage === "open"
  const dateLabel = formatWelcomeDate(eventDate)

  // Trigger onOpeningComplete after transition delay if opening
  useEffect(() => {
    if (stage === "opening" && onOpeningComplete) {
      const timer = window.setTimeout(
        () => {
          onOpeningComplete()
        },
        reducedMotion ? 50 : 600,
      )
      return () => window.clearTimeout(timer)
    }
  }, [stage, onOpeningComplete, reducedMotion])

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose?.()
        return
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return

        const first = focusables[0]
        const last = focusables[focusables.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    // Initial focus entry
    const timer = setTimeout(() => {
      if (isEnvelopeOpen && closeButtonRef.current) {
        closeButtonRef.current.focus()
      } else if (openButtonRef.current) {
        openButtonRef.current.focus()
      }
    }, 50)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      clearTimeout(timer)
    }
  }, [isVisible, isEnvelopeOpen, onClose])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6",
        "bg-black/85 backdrop-blur-md transition-opacity duration-300",
        stage === "closing" && "opacity-0 pointer-events-none",
      )}
      data-testid="welcome-splash-modal"
      data-welcome-stage={stage}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="splash-title"
        className={cn(
          "relative w-full max-w-2xl rounded-3xl border border-white/20 bg-background/95 p-6 shadow-2xl sm:p-10",
          "transition-all duration-500 transform",
          reducedMotion ? "transition-none" : "",
        )}
      >
        {/* Top Control Bar */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
          {audioStatus !== "disabled" && onToggleAudio ? (
            <button
              type="button"
              onClick={onToggleAudio}
              aria-label={audioStatus === "playing" ? "Tắt âm thanh" : "Bật âm thanh"}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-accent"
              data-testid="splash-audio-toggle"
            >
              {audioStatus === "playing" ? (
                <Music className="size-5 text-primary animate-pulse" aria-hidden="true" />
              ) : (
                <Music2 className="size-5 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          ) : null}

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng thiệp chào mừng"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition-colors hover:bg-accent"
            data-testid="splash-close-btn"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* 3D Envelope Container */}
        <div className="perspective-[1200px] py-4">
          {!isEnvelopeOpen ? (
            /* Envelope Sealed View */
            <div
              className={cn(
                "relative mx-auto flex flex-col items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-accent/20 p-8 text-center shadow-xl sm:p-12",
                "transition-transform duration-500 hover:scale-[1.02]",
              )}
              data-testid="envelope-sealed"
            >
              <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/20 text-primary ring-8 ring-primary/10">
                <MailOpen className="size-10" aria-hidden="true" />
              </div>

              <span className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                Thiệp mời điện tử 3D
              </span>

              <h2 id="splash-title" className="mb-4 font-heading text-2xl font-bold tracking-tight sm:text-4xl">
                {title}
              </h2>

              {dateLabel ? (
                <p className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                  {dateLabel}
                </p>
              ) : null}

              <button
                ref={openButtonRef}
                type="button"
                onClick={onOpenEnvelope}
                disabled={stage === "closing"}
                className={buttonVariants({
                  variant: "event",
                  size: "lg",
                  className: "min-h-[44px] min-w-[160px] px-8 text-base shadow-lg transition-transform hover:scale-105",
                })}
                data-testid="open-envelope-btn"
              >
                Mở thiệp ngay
              </button>
            </div>
          ) : (
            /* Invitation Card Opened View */
            <div
              className={cn(
                "flex flex-col gap-6 rounded-2xl p-2 sm:p-4",
                "animate-in fade-in-50 zoom-in-95 duration-500",
                reducedMotion && "animate-none",
              )}
              data-testid="envelope-opened"
            >
              {coverUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border shadow-md">
                  <PosterMedia
                    src={coverUrl}
                    alt={title + " cover"}
                    fit="cover"
                    position="center"
                    border={false}
                    shadow={true}
                    backgroundBlur={true}
                  />
                </div>
              ) : null}

              <div className="space-y-3 text-center sm:text-left">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Memoria Event</span>

                <h2 id="splash-title" className="font-heading text-3xl font-bold tracking-tight sm:text-5xl">
                  {title}
                </h2>

                {description ? (
                  <p className="text-base text-muted-foreground leading-relaxed sm:text-lg">{description}</p>
                ) : null}

                {dateLabel ? (
                  <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                    <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                    {dateLabel}
                  </p>
                ) : null}

                {eventDate ? (
                  <div className="pt-2">
                    <WelcomeCountdown target={eventDate} initialNow={initialNow} />
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
                {onSendWish ? (
                  <button
                    type="button"
                    onClick={onSendWish}
                    className={buttonVariants({
                      variant: "event",
                      size: "lg",
                      className: "flex-1 min-h-[44px] justify-center text-base shadow-md",
                    })}
                    data-testid="splash-send-wish-btn"
                  >
                    <Send className="mr-2 size-5" aria-hidden="true" />
                    Gửi lời chúc ngay
                  </button>
                ) : null}

                {onExploreEvent ? (
                  <button
                    type="button"
                    onClick={onExploreEvent}
                    className={buttonVariants({
                      variant: "event-outline",
                      size: "lg",
                      className: "flex-1 min-h-[44px] justify-center text-base",
                    })}
                    data-testid="splash-explore-btn"
                  >
                    <Compass className="mr-2 size-5" aria-hidden="true" />
                    Khám phá sự kiện
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
