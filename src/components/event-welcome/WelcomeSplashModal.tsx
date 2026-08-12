"use client"

import { CalendarDays, Compass, Music, Music2, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { formatWelcomeDate, type AudioStatus, type WelcomeStage } from "@/features/events/welcome"
import type { WelcomeHeroConfig } from "@/features/events/welcome-config"
import { cn } from "@/lib/utils"

import {
  ANIME_STICKERS,
  AnimatedSticker,
  StickerReactionLayer,
  useStickerReactions,
} from "@/components/effects/animated-stickers"
import {
  InvitationStickerScene,
  type InvitationStickerSceneHandle,
} from "@/components/invitation/stickers/InvitationStickerScene"
import { PosterMedia } from "./poster-media"
import { WelcomeCountdown } from "./welcome-countdown"

export type WelcomeSplashModalProps = {
  isOpen: boolean
  stage: WelcomeStage
  title: string
  coverUrl: string | null
  eventDate: string | null
  description: string | null
  posterConfig?: WelcomeHeroConfig["poster"]
  reducedMotion?: boolean
  audioStatus?: AudioStatus
  onOpenEnvelope?: () => void
  onOpeningComplete?: () => void
  onClose?: () => void
  onSendWish?: () => void
  onExploreEvent?: () => void
  onToggleAudio?: () => void
}

type StickerPackKey = "gold" | "romance" | "party"

const STICKER_PACKS: Record<
  StickerPackKey,
  {
    name: string
    badge: string
    stampText: string
    sealIcon: string
    cornerIcon: string
    emojis: string[]
    borderGlow: string
  }
> = {
  gold: {
    name: "Hoàng Gia Gold",
    badge: "👑 VIP INVITATION",
    stampText: "SPECIAL EDITION",
    sealIcon: "👑",
    cornerIcon: "✦",
    emojis: ["✨", "👑", "🥂", "🌟", "🎖️"],
    borderGlow: "border-amber-400/40 shadow-[0_0_50px_rgba(251,191,36,0.25)]",
  },
  romance: {
    name: "Lãng Mạn Rose",
    badge: "🌹 THÂN MỜI",
    stampText: "WITH LOVE",
    sealIcon: "💖",
    cornerIcon: "🌸",
    emojis: ["💖", "🌹", "🌸", "🎀", "✨"],
    borderGlow: "border-rose-400/40 shadow-[0_0_50px_rgba(244,63,94,0.25)]",
  },
  party: {
    name: "Tiệc Mừng Party",
    badge: "🎉 CELEBRATION",
    stampText: "PARTY TIME",
    sealIcon: "🎈",
    cornerIcon: "🥳",
    emojis: ["🎉", "🎈", "🥂", "🥳", "✨"],
    borderGlow: "border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.25)]",
  },
}

export function WelcomeSplashModal({
  isOpen,
  stage,
  title,
  coverUrl,
  eventDate,
  description,
  posterConfig,
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
  const stickerSceneRef = useRef<InvitationStickerSceneHandle>(null)
  const [initialNow] = useState(() => new Date().toISOString())

  const [activeStickerPack, setActiveStickerPack] = useState<StickerPackKey>("gold")
  const { floatingStickers, spawnStickerReaction } = useStickerReactions()

  const currentPack = STICKER_PACKS[activeStickerPack]
  const isVisible = isOpen && stage !== "closed" && stage !== "dismissed" && stage !== "checking"
  const isEnvelopeOpen = stage === "open"
  const dateLabel = formatWelcomeDate(eventDate)

  // Trigger onOpeningComplete after transition delay if opening
  useEffect(() => {
    if (stage === "opening") {
      stickerSceneRef.current?.celebrate({ intensity: "high", duration: 3500 })
      if (onOpeningComplete) {
        const timer = window.setTimeout(
          () => {
            onOpeningComplete()
          },
          reducedMotion ? 50 : 1400,
        )
        return () => window.clearTimeout(timer)
      }
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
        "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain overflow-x-hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8",
        "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-black/85 to-black/95 backdrop-blur-md transition-opacity duration-300",
        stage === "closing" && "opacity-0 pointer-events-none",
      )}
      data-testid="welcome-splash-modal"
      data-welcome-stage={stage}
    >
      {/* Interactive Sticker Characters Canvas Scene & Speech Overlay */}
      <InvitationStickerScene
        ref={stickerSceneRef}
        exclusionSelectors={[
          "[data-sticker-safe='title']",
          "[data-sticker-safe='event-time']",
          "[data-sticker-safe='rsvp']",
        ]}
        className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      />

      {/* Floating Animated Anime Mascot Sticker Reaction Layer */}
      <StickerReactionLayer particles={floatingStickers} />

      {/* Floating Animated Reaction Emojis */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
        {activeReactions.map((reaction) => (
          <span
            key={reaction.id}
            style={{ left: reaction.x, top: reaction.y }}
            className="fixed text-3xl font-bold animate-bounce drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] transition-all duration-1000"
          >
            {reaction.emoji}
          </span>
        ))}
      </div>

      {/* Background Ambient Sparkles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute left-[10%] top-[15%] text-2xl text-amber-400/60 animate-pulse">✨</span>
        <span className="absolute right-[12%] top-[20%] text-xl text-primary/70 animate-ping">✦</span>
        <span className="absolute left-[18%] bottom-[20%] text-lg text-amber-300/50 animate-pulse">★</span>
        <span className="absolute right-[15%] bottom-[15%] text-2xl text-amber-400/70 animate-pulse">✨</span>
      </div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="splash-title"
        className={cn(
          "relative flex max-h-[92dvh] w-full max-w-xl sm:max-w-2xl lg:max-w-3xl flex-col bg-transparent p-0 sm:max-h-[95dvh]",
          "transition-all duration-500 transform",
          reducedMotion ? "transition-none" : "",
        )}
      >
        {/* Harmonized Top Control Bar (Aligned perfectly with Envelope width) */}
        <div className="flex shrink-0 items-center justify-between w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto pb-2 px-1 z-40">
          {/* Decorative Vintage Stamp Sticker (Top Left) */}
          <div
            aria-hidden="true"
            className="pointer-events-none hidden -rotate-6 select-none sm:block"
          >
            <div className="rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-400/10 px-3 py-1.5 backdrop-blur-sm shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                {currentPack.stampText} ✦ 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Sticker Pack Selector */}
            <div className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-background/90 p-1 shadow-lg backdrop-blur-md">
              {(["gold", "romance", "party"] as StickerPackKey[]).map((packKey) => (
                <button
                  key={packKey}
                  type="button"
                  onClick={() => setActiveStickerPack(packKey)}
                  aria-label={STICKER_PACKS[packKey].name}
                  aria-pressed={activeStickerPack === packKey}
                  title={STICKER_PACKS[packKey].name}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full text-xs transition-all",
                    activeStickerPack === packKey
                      ? "bg-amber-400 text-black font-bold shadow-sm scale-110"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  {STICKER_PACKS[packKey].sealIcon}
                </button>
              ))}
            </div>

            {audioStatus !== "disabled" && onToggleAudio ? (
              <button
                type="button"
                onClick={onToggleAudio}
                aria-label={audioStatus === "playing" ? "Tắt âm thanh" : "Bật âm thanh"}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-amber-400/40 bg-background/90 text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-accent"
                data-testid="splash-audio-toggle"
              >
                {audioStatus === "playing" ? (
                  <Music className="size-5 text-amber-400 animate-pulse" aria-hidden="true" />
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
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-amber-400/40 bg-background/90 text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-accent"
              data-testid="splash-close-btn"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 3D Envelope Container with Smooth Internal Scroll & Clean Spacing */}
        <div className="perspective-[1400px] flex-1 overflow-y-auto overscroll-contain overflow-x-hidden w-full min-w-0 px-1 pt-1 scrollbar-thin scrollbar-thumb-amber-400/30">
          {!isEnvelopeOpen ? (
            /* 3D Sealed Envelope View */
            <div
              className={cn(
                "relative mx-auto flex min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] w-full max-w-xl sm:max-w-2xl lg:max-w-3xl flex-col items-center justify-center rounded-3xl border-2 border-amber-400/40 bg-gradient-to-b from-amber-950/40 via-background/95 to-amber-900/40 p-6 sm:p-8 lg:p-10 text-center shadow-[0_25px_70px_rgba(0,0,0,0.8)]",
                currentPack.borderGlow,
                "transition-all duration-700 transform-gpu",
                stage === "opening" && "scale-105 shadow-[0_0_90px_rgba(251,191,36,0.6)]",
              )}
              data-testid="envelope-sealed"
            >
              {/* 3D Envelope Triangular Flap (Flips 180° Open when clicked) */}
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-32 origin-top transition-transform duration-1000 ease-in-out transform-gpu z-20 pointer-events-none",
                  stage === "opening" ? "-rotate-x-180 opacity-40 scale-y-90" : "rotate-x-0",
                )}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Triangular Paper Flap Shape */}
                <div className="size-full bg-gradient-to-b from-amber-500/25 via-amber-400/15 to-transparent clip-path-envelope-flap border-b border-amber-400/40 drop-shadow-md" />
              </div>

              {/* Top-Right Pinned Anime Sticker: Open Envelope & Confetti Burst */}
              <div className="absolute right-2 top-2 sm:-right-3 sm:-top-3 z-30 flex flex-col items-center">
                <AnimatedSticker
                  sticker={ANIME_STICKERS[0]}
                  size="md"
                  onClick={(e) => {
                    spawnStickerReaction(ANIME_STICKERS[0], e.clientX, e.clientY)
                    onOpenEnvelope?.()
                  }}
                />
                <span className="mt-0.5 rounded-full border border-amber-400/60 bg-amber-400 px-2 py-0.5 text-[10px] font-black text-black shadow-md">
                  🥳 Mở thiệp!
                </span>
              </div>

              {/* Top-Left Pinned Anime Sticker: Toggle Audio */}
              {onToggleAudio ? (
                <div className="absolute left-2 top-2 sm:-left-3 sm:-top-3 z-30 flex flex-col items-center">
                  <AnimatedSticker
                    sticker={ANIME_STICKERS[2]}
                    size="md"
                    onClick={(e) => {
                      spawnStickerReaction(ANIME_STICKERS[2], e.clientX, e.clientY)
                      onToggleAudio()
                    }}
                  />
                  <span className="mt-0.5 rounded-full border border-amber-400/60 bg-black/80 px-2 py-0.5 text-[10px] font-bold text-amber-400 shadow-md">
                    🎵 Âm thanh
                  </span>
                </div>
              ) : null}

              {/* Royal Embossed Wax Seal Badge (Cracks/Flashes open) */}
              <button
                type="button"
                onClick={onOpenEnvelope}
                className={cn(
                  "relative z-30 mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-2xl text-white shadow-[0_0_35px_rgba(251,191,36,0.6)] ring-8 ring-amber-400/30 transition-transform duration-300 hover:scale-110 active:scale-95 sm:mb-6 sm:size-24 sm:text-3xl",
                  stage === "opening" && "animate-ping opacity-75 scale-125",
                )}
                title="Bấm để lật mở con dấu sáp"
              >
                <span className="drop-shadow-md">{currentPack.sealIcon}</span>
                <span className="absolute -bottom-2 rounded-full border border-amber-300 bg-black/90 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-400 shadow-lg">
                  WAX SEAL
                </span>
              </button>

              <span className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
                <span>✨</span> {currentPack.badge} <span>✨</span>
              </span>

              <h2 id="splash-title" className="mb-3 font-heading text-xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl" data-sticker-safe="title">
                {title}
              </h2>

              {dateLabel ? (
                <p className="mb-6 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:text-sm lg:text-base" data-sticker-safe="event-time">
                  <CalendarDays className="size-4 text-amber-400" aria-hidden="true" />
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
                  className:
                    "z-30 min-h-[46px] min-w-[200px] px-8 text-sm font-black shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-transform hover:scale-105 bg-gradient-to-r from-amber-500 via-amber-400 to-primary text-black sm:text-base lg:text-lg lg:py-6",
                })}
                data-testid="open-envelope-btn"
              >
                💌 Mở phong thư ngay 💌
              </button>
            </div>
          ) : (
            /* 3D Invitation Letter Opened View (Slides Out from Envelope) */
            <div
              className={cn(
                "relative mx-auto flex flex-col gap-4 sm:gap-6 rounded-3xl border-2 border-amber-400/40 bg-gradient-to-b from-amber-950/30 via-background/95 to-amber-900/30 p-6 sm:p-8 lg:p-10 w-full max-w-xl sm:max-w-2xl lg:max-w-3xl shadow-[0_25px_70px_rgba(0,0,0,0.8)]",
                currentPack.borderGlow,
                "animate-in fade-in-50 slide-in-from-bottom-8 zoom-in-95 duration-700 ease-out",
                reducedMotion && "animate-none",
              )}
              data-testid="envelope-opened"
            >
              {/* Top Letterhead Calligraphy Header Ornament */}
              <div className="flex items-center justify-between border-b border-amber-400/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📜</span>
                  <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 sm:text-sm">
                    THƯ MỜI CHÍNH THỨC ✦ MEMORIA
                  </span>
                </div>
                <span className="rounded-full border border-amber-400/50 bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 sm:text-xs">
                  {currentPack.badge}
                </span>
              </div>

              {/* Top-Right Pinned Anime Mascot Sticker: Re-trigger Confetti & Party Action */}
              <div className="absolute right-2 top-2 sm:-right-3 sm:-top-3 z-20 flex flex-col items-center">
                <AnimatedSticker
                  sticker={ANIME_STICKERS[0]}
                  size="md"
                  onClick={(e) => {
                    spawnStickerReaction(ANIME_STICKERS[0], e.clientX, e.clientY)
                    onOpeningComplete?.()
                  }}
                />
                <span className="mt-0.5 rounded-full border border-amber-400/60 bg-amber-400 px-2 py-0.5 text-[10px] font-black text-black shadow-md">
                  🥳 Bắn pháo hoa!
                </span>
              </div>

              {/* Top-Left Pinned Anime Mascot Sticker: Toggle Audio */}
              {onToggleAudio ? (
                <div className="absolute left-2 top-2 sm:-left-3 sm:-top-3 z-20 flex flex-col items-center">
                  <AnimatedSticker
                    sticker={ANIME_STICKERS[2]}
                    size="md"
                    onClick={(e) => {
                      spawnStickerReaction(ANIME_STICKERS[2], e.clientX, e.clientY)
                      onToggleAudio()
                    }}
                  />
                  <span className="mt-0.5 rounded-full border border-amber-400/60 bg-black/80 px-2 py-0.5 text-[10px] font-bold text-amber-400 shadow-md">
                    🎵 {audioStatus === "playing" ? "Tắt nhạc" : "Bật nhạc"}
                  </span>
                </div>
              ) : null}

              {/* Bottom-Right Pinned Anime Mascot Sticker: Send Wish Action */}
              {onSendWish ? (
                <div className="absolute right-2 bottom-2 sm:-bottom-3 sm:-right-3 z-20 flex flex-col items-center">
                  <AnimatedSticker
                    sticker={ANIME_STICKERS[1]}
                    size="md"
                    onClick={(e) => {
                      spawnStickerReaction(ANIME_STICKERS[1], e.clientX, e.clientY)
                      onSendWish()
                    }}
                  />
                  <span className="mt-0.5 rounded-full border border-amber-400/60 bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                    💖 Gửi Lời Chúc
                  </span>
                </div>
              ) : null}

              {coverUrl ? (
                <div className={cn(
                  "relative w-full overflow-hidden rounded-2xl border border-amber-400/30 shadow-md",
                  posterConfig?.aspectRatio === "square" ? "aspect-square" :
                  posterConfig?.aspectRatio === "landscape" ? "aspect-video" :
                  posterConfig?.aspectRatio === "portrait" ? "aspect-[3/4]" :
                  "aspect-video max-h-[180px] sm:max-h-[240px] lg:max-h-[300px]"
                )}>
                  <PosterMedia
                    src={coverUrl}
                    alt={title + " cover"}
                    fit={posterConfig?.fit ?? "cover"}
                    position={posterConfig?.position ?? "center"}
                    border={posterConfig?.border ?? false}
                    shadow={posterConfig?.shadow ?? true}
                    backgroundBlur={posterConfig?.backgroundBlur ?? true}
                  />
                </div>
              ) : null}

              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-xs">Memoria Event</span>

                <h2 id="splash-title" className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl" data-sticker-safe="title">
                  {title}
                </h2>

                {description ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed sm:text-base lg:text-lg">{description}</p>
                ) : null}

                {dateLabel ? (
                  <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-start sm:text-sm lg:text-base" data-sticker-safe="event-time">
                    <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                    {dateLabel}
                  </p>
                ) : null}

                {eventDate ? (
                  <div className="pt-1">
                    <WelcomeCountdown target={eventDate} initialNow={initialNow} />
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:items-center" data-sticker-safe="rsvp">
                {onSendWish ? (
                  <button
                    type="button"
                    onClick={onSendWish}
                    className={buttonVariants({
                      variant: "event",
                      size: "lg",
                      className: "flex-1 min-h-[44px] justify-center text-sm font-semibold shadow-md sm:text-base lg:text-lg lg:h-12",
                    })}
                    data-testid="splash-send-wish-btn"
                  >
                    <Send className="mr-2 size-4 sm:size-5" aria-hidden="true" />
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
                      className: "flex-1 min-h-[44px] justify-center text-sm font-semibold sm:text-base lg:text-lg lg:h-12",
                    })}
                    data-testid="splash-explore-btn"
                  >
                    <Compass className="mr-2 size-4 sm:size-5" aria-hidden="true" />
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
