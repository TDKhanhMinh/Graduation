import type { ReactNode } from "react"
import Link from "next/link"
import { CalendarDays, ChevronDown, Compass, Send } from "lucide-react"

import { StatusBadge } from "@/components/ui/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  createWelcomeViewModel,
  formatWelcomeDate,
  getWelcomePresentation,
} from "@/features/events/welcome"

import { PosterMedia } from "./poster-media"
import { WelcomeCountdown } from "./welcome-countdown"

type EventWelcomeProps = {
  title: string
  description: string | null
  eventDate: string | null
  submissionMode: string | null
  coverUrl: string | null
  themeKey: string
  decorativeLayers?: ReactNode
  shareAction?: ReactNode
}

export function EventWelcome({
  title,
  description,
  eventDate,
  submissionMode,
  coverUrl,
  themeKey,
  decorativeLayers,
  shareAction,
}: EventWelcomeProps) {
  const initialNow = new Date()
  const viewModel = createWelcomeViewModel(
    { event_date: eventDate, submission_mode: submissionMode },
    initialNow,
  )
  const presentation = getWelcomePresentation(viewModel.status)
  const dateLabel = formatWelcomeDate(eventDate)
  const welcomeMessage = description || presentation.statusCopy

  return (
    <section
      id="welcome-hero"
      aria-labelledby="event-welcome-title"
      data-testid="event-welcome"
      data-welcome-layout="poster-focus cinematic-split"
      data-event-status={viewModel.status}
      data-event-theme={themeKey}
      className="welcome-hero-surface relative isolate overflow-hidden rounded-[2rem] border border-[var(--event-border)] bg-[var(--event-surface)] shadow-[0_28px_70px_-48px_var(--event-primary)]"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {decorativeLayers}
      </div>
      <div className="relative z-10 grid min-h-[520px] lg:grid-cols-[3fr_2fr]">
        <div className="welcome-hero-content order-2 flex min-w-0 flex-col justify-center gap-6 p-6 sm:p-10 lg:order-1 lg:p-14">
          <StatusBadge tone={presentation.badgeTone} className="welcome-hero-status w-fit">{presentation.badge}</StatusBadge>
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Memoria</p>
            <h2
              id="event-welcome-title"
              className="max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl"
            >
              {title}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{welcomeMessage}</p>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground" data-testid="welcome-status-copy">
                {presentation.statusCopy}
              </p>
            ) : null}
            {dateLabel ? (
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
                {dateLabel}
              </p>
            ) : null}
            {viewModel.countdownTarget ? (
              <WelcomeCountdown target={viewModel.countdownTarget} initialNow={initialNow.toISOString()} />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`#${presentation.primaryTarget}`}
              className={buttonVariants({ variant: "event", size: "lg", className: "min-h-(--control-min-size)" })}
            >
              <Send aria-hidden="true" />
              {presentation.primaryLabel}
            </Link>
            <Link
              href="#wall-heading"
              className={buttonVariants({ variant: "event-outline", size: "lg", className: "min-h-(--control-min-size)" })}
            >
              <Compass aria-hidden="true" />
              {presentation.canSubmitWish ? "Khám phá sự kiện" : "Xem lại sự kiện"}
            </Link>
            {shareAction}
          </div>
          <Link
            href="#wall-heading"
            className={cn("welcome-scroll-indicator inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline")}
            aria-label="Explore the event wall"
          >
            Scroll to explore
            <ChevronDown aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="welcome-hero-poster order-1 min-w-0 overflow-hidden lg:order-2">
          <PosterMedia src={coverUrl} alt={`${title} cover`} />
        </div>
      </div>
    </section>
  )
}
