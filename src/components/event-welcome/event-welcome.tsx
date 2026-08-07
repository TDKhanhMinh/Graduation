"use client"

import { CalendarDays, ChevronDown, Compass, MailOpen, Send } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { CelebrationConfetti } from "@/components/effects/celebration-confetti"
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  WELCOME_ANCHORS,
  createWelcomeViewModel,
  formatWelcomeDate,
  getWelcomePresentation,
} from "@/features/events/welcome"
import type { WelcomeHeroConfig } from "@/features/events/welcome-config"
import { cn } from "@/lib/utils"

import { PosterMedia } from "./poster-media"
import { WelcomeAnalytics } from "./welcome-analytics"
import { WelcomeCountdown } from "./welcome-countdown"
import { useWelcomeExperience } from "./WelcomeExperience"
import { WelcomeSplashModal } from "./WelcomeSplashModal"

type EventWelcomeProps = {
  slug: string
  title: string
  description: string | null
  eventDate: string | null
  submissionMode: string | null
  coverUrl: string | null
  themeKey: string
  welcomeConfig: WelcomeHeroConfig
  decorativeLayers?: ReactNode
  shareAction?: ReactNode
}

function WelcomeSplashIntegration({
  title,
  description,
  eventDate,
  coverUrl,
  posterConfig,
}: {
  title: string
  description: string | null
  eventDate: string | null
  coverUrl: string | null
  posterConfig: WelcomeHeroConfig["poster"]
}) {
  const experience = useWelcomeExperience()

  return (
    <>
      <CelebrationConfetti
        active={experience.confettiActive}
        triggerKey={experience.confettiTriggerCount}
        reducedMotion={experience.reducedMotion}
        onComplete={experience.completeConfetti}
      />
      <WelcomeSplashModal
        isOpen={experience.stage !== "closed" && experience.stage !== "dismissed" && experience.stage !== "checking"}
        stage={experience.stage}
        title={title}
        coverUrl={coverUrl}
        eventDate={eventDate}
        description={description}
        posterConfig={posterConfig}
        reducedMotion={experience.reducedMotion}
        audioStatus={experience.audioStatus}
        onOpenEnvelope={experience.openEnvelope}
        onOpeningComplete={experience.completeOpening}
        onClose={experience.closeModal}
        onSendWish={experience.sendWish}
        onExploreEvent={experience.exploreEvent}
      />
    </>
  )
}

function ReopenButton() {
  const experience = useWelcomeExperience()

  return (
    <button
      type="button"
      onClick={(e) => experience?.reopenModal(e.currentTarget)}
      className={buttonVariants({ variant: "event-outline", size: "lg", className: "min-h-(--control-min-size)" })}
      data-testid="welcome-reopen-btn"
    >
      <MailOpen aria-hidden="true" />
      Xem lại thiệp
    </button>
  )
}

export function EventWelcome({
  slug,
  title,
  description,
  eventDate,
  submissionMode,
  coverUrl,
  themeKey,
  welcomeConfig,
  decorativeLayers,
  shareAction,
}: EventWelcomeProps) {
  const initialNow = new Date()
  const viewModel = createWelcomeViewModel(
    { event_date: eventDate, submission_mode: submissionMode },
    initialNow,
  )
  const presentation = getWelcomePresentation(viewModel.status)
  const layout = welcomeConfig.layout === "poster-focus" ? "poster-focus" : "split"
  const isEnabled = welcomeConfig.enabled
  const primaryTarget = viewModel.canSubmitWish && welcomeConfig.primaryAction === "submit-wish"
    ? WELCOME_ANCHORS.wish
    : WELCOME_ANCHORS.gallery
  const primaryLabel = viewModel.canSubmitWish ? welcomeConfig.primaryLabel : presentation.primaryLabel
  const welcomeMessage = welcomeConfig.message || description || presentation.statusCopy

  return (
    <WelcomeAnalytics slug={slug} status={viewModel.status}>
      <section
      id="welcome-hero"
      aria-labelledby="event-welcome-title"
      data-testid="event-welcome"
      data-welcome-layout={layout}
      data-welcome-enabled={isEnabled}
      data-welcome-intro={welcomeConfig.effects.introAnimation ? "enabled" : "disabled"}
      data-event-status={viewModel.status}
      data-event-theme={themeKey}
      className={cn(
        "welcome-hero-surface relative isolate overflow-hidden rounded-[2rem] border border-[var(--event-border)] bg-[var(--event-surface)] shadow-[0_28px_70px_-48px_var(--event-primary)]",
        !isEnabled && "border-dashed shadow-none",
      )}
    >
      {isEnabled ? <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">{decorativeLayers}</div> : null}
      <div className={cn(
        "relative z-10 min-h-[520px] p-6 lg:p-14",
        isEnabled && layout === "split" ? "flex flex-col lg:flex-row items-center gap-8 lg:gap-14" : "flex flex-col",
      )}>
        <div className={cn(
          "welcome-hero-content flex min-w-0 flex-col justify-center gap-6",
          isEnabled && layout === "split" ? "order-2 lg:order-1 flex-1" : "order-2",
          !isEnabled && "order-1",
        )}>
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
            {description && !welcomeConfig.message ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground" data-testid="welcome-status-copy">
                {presentation.statusCopy}
              </p>
            ) : null}
            {welcomeConfig.showDate && formatWelcomeDate(eventDate) ? (
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
                {formatWelcomeDate(eventDate)}
              </p>
            ) : null}
            {welcomeConfig.showDate && viewModel.countdownTarget ? (
              <WelcomeCountdown target={viewModel.countdownTarget} initialNow={initialNow.toISOString()} />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={"#" + primaryTarget}
              data-welcome-action={primaryTarget === WELCOME_ANCHORS.wish ? "submit-wish" : "explore"}
              className={buttonVariants({ variant: "event", size: "lg", className: "min-h-(--control-min-size)" })}
            >
              <Send aria-hidden="true" />
              {primaryLabel}
            </Link>
            <Link
              href="#wall-heading"
              data-welcome-action="explore"
              className={buttonVariants({ variant: "event-outline", size: "lg", className: "min-h-(--control-min-size)" })}
            >
              <Compass aria-hidden="true" />
              {welcomeConfig.secondaryLabel}
            </Link>
            <ReopenButton />
            {shareAction}
          </div>
          <Link
            href="#wall-heading"
            className={cn("welcome-scroll-indicator inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline mt-20")}
            aria-label="Khám phá bức tường sự kiện"
          >
            Cuộn để khám phá
            <ChevronDown aria-hidden="true" className="size-4" />
          </Link>
        </div>
        {isEnabled ? (
          <div className={cn(
            "welcome-hero-poster relative min-w-0 overflow-hidden rounded-xl lg:rounded-2xl shadow-xl",
            layout === "split" ? "order-1 w-full lg:order-2 lg:w-2/5 shrink-0" : "order-1 w-full",
            welcomeConfig.poster.aspectRatio === "square" ? "aspect-square" :
            welcomeConfig.poster.aspectRatio === "landscape" ? "aspect-video" :
            welcomeConfig.poster.aspectRatio === "portrait" ? "aspect-[3/4]" :
            "min-h-[24rem] lg:min-h-full"
          )}>
            <PosterMedia
              src={coverUrl}
              alt={title + " cover"}
              fit={welcomeConfig.poster.fit}
              position={welcomeConfig.poster.position}
              border={welcomeConfig.poster.border}
              shadow={welcomeConfig.poster.shadow}
              backgroundBlur={welcomeConfig.poster.backgroundBlur}
            />
          </div>
        ) : null}
      </div>
      </section>
      <WelcomeSplashIntegration
        title={title}
        description={welcomeMessage}
        eventDate={eventDate}
        coverUrl={coverUrl}
        posterConfig={welcomeConfig.poster}
      />
    </WelcomeAnalytics>
  )
}
